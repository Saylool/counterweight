"""Digest-only oracle. Does not instantiate an account or load/create any signing key."""
from decimal import Decimal
import copy
import hashlib
import importlib.metadata
import json
from types import SimpleNamespace
from unittest.mock import patch
from hyperliquid import exchange
from pathlib import Path
from eth_utils import keccak
from hyperliquid.utils import signing

SDK_COMMIT = '2fdb18f9517675ea03695a0962bd19eece9c83f0'
SDK_SOURCE_SHA256 = '938ec0a1f9611874b423ca946696e19a71d32d14709f521ea5d526f4398c0b85'
SDK_EXCHANGE_SHA256 = '0bd885c5b64fd77893db58d4982b0d24e92b5be5036d0e9d6d05c40a1812d432'
assert hashlib.sha256(Path(exchange.__file__).read_bytes()).hexdigest() == SDK_EXCHANGE_SHA256
assert importlib.metadata.version('hyperliquid-python-sdk') == '0.24.0'
assert hashlib.sha256(Path(signing.__file__).read_bytes()).hexdigest() == SDK_SOURCE_SHA256

public_signature = json.loads(Path('fixtures/hyperliquid-testnet-public-control.json').read_text())['request']['signature']

class DigestObserver:
    def sign_message(self, message):
        # Intercept the official SDK immediately before its signing boundary.
        self.digest = '0x' + keccak(b'\x19' + message.version + message.header + message.body).hex()
        # Reuse public signature bytes solely to let Exchange finish constructing its POST.
        return {'r':int(public_signature['r'], 16), 's':int(public_signature['s'], 16), 'v':public_signature['v']}

nonce = 1700000000123
addr = '0x1234567890123456789012345678901234567890'
order = {'type':'order', 'orders':[{'a':54,'b':False,'p':'1.25','s':'10','r':False,'t':{'limit':{'tif':'Alo'}}}], 'grouping':'na'}
trigger = {'type':'order','orders':[{'a':54,'b':True,'p':'10','s':'1.2','r':True,'t':{'trigger':{'isMarket':True,'triggerPx':'9.5','tpsl':'sl'}},'c':'0x1234567890abcdef1234567890abcdef'}],'grouping':'positionTpsl'}
cancel = {'type':'cancel','cancels':[{'a':54,'o':1234567890123}]}
cloid = {'type':'cancelByCloid','cancels':[{'asset':54,'cloid':'0x1234567890abcdef1234567890abcdef'}]}
vectors = []
for network in ['testnet', 'mainnet']:
    for name, action, vault, expiry in [
        ('noop',{'type':'noop'},None,None), ('noop-expiry',{'type':'noop'},None,nonce+60000), ('order',order,None,None), ('trigger',trigger,None,None), ('cancel',cancel,None,None),
        ('cloid',cloid,None,None), ('vault',order,addr,None), ('expiry',cancel,None,nonce+60000),
        ('vault-expiry',order,addr,nonce+60000),
        ('msgpack-boundaries',{'type':'cancel','cancels':[{'a':x,'o':x} for x in [0,127,128,255,256,65535,65536,4294967295,4294967296,9007199254740991]]},None,None),
    ]:
        observer = DigestObserver()
        signing.sign_l1_action(observer, action, vault, nonce, expiry, network=='mainnet')
        vectors.append({'name':network+'-'+name, 'scheme':'l1','network':network,'action':copy.deepcopy(action),'nonce':nonce,
          **({'vaultAddress':vault} if vault else {}), **({'expiresAfter':expiry} if expiry else {}),
          'actionHash':'0x'+signing.action_hash(action,vault,nonce,expiry).hex(), 'digest':observer.digest,
          'sdkRecovered':signing.recover_agent_or_user_from_l1_action(action,public_signature,vault,nonce,expiry,network=='mainnet').lower()})
    for name, action, fn in [
        ('approveAgent',{'type':'approveAgent','agentAddress':addr,'agentName':'counterweight-test','nonce':nonce}, signing.sign_agent),
        ('approveAgent-empty-name',{'type':'approveAgent','agentAddress':addr,'agentName':'','nonce':nonce}, signing.sign_agent),
        ('withdraw3',{'type':'withdraw3','destination':addr,'amount':'1.000001','time':nonce},signing.sign_withdraw_from_bridge_action),
        ('usdSend',{'type':'usdSend','destination':addr,'amount':'1','time':nonce},signing.sign_usd_transfer_action),
    ]:
        original = copy.deepcopy(action)
        observer = DigestObserver()
        fn(observer,action,network=='mainnet')
        signed_action = copy.deepcopy(action)
        if original['type'] == 'approveAgent':
            # Execute the real Exchange wire path, replacing BOTH entropy and account
            # construction with a public-address stub. No valid key is made or read.
            client = exchange.Exchange.__new__(exchange.Exchange)
            client.wallet = observer
            client.base_url = exchange.MAINNET_API_URL if network == 'mainnet' else 'https://api.hyperliquid-testnet.xyz'
            client._post_action = lambda wire, signature, timestamp: copy.deepcopy(wire)
            with patch.object(exchange, 'secrets', SimpleNamespace(token_hex=lambda _: 'PUBLIC_ADDRESS_ONLY_STUB')), \
                 patch.object(exchange.eth_account, 'Account', SimpleNamespace(from_key=lambda _: SimpleNamespace(address=addr))), \
                 patch.object(exchange, 'get_timestamp_ms', return_value=nonce):
                action, _ = client.approve_agent(original['agentName'] or None)
        if original['type'] == 'approveAgent':
            payload_types = [{'name':'hyperliquidChain','type':'string'},{'name':'agentAddress','type':'address'},{'name':'agentName','type':'string'},{'name':'nonce','type':'uint64'}]
            primary_type = 'HyperliquidTransaction:ApproveAgent'
        else:
            payload_types = signing.WITHDRAW_SIGN_TYPES if original['type'] == 'withdraw3' else signing.USD_SEND_SIGN_TYPES
            primary_type = 'HyperliquidTransaction:Withdraw' if original['type'] == 'withdraw3' else 'HyperliquidTransaction:UsdSend'
        recovered = signing.recover_user_from_user_signed_action(signed_action,public_signature,payload_types,primary_type,network=='mainnet').lower()
        vectors.append({'name':network+'-'+name,'scheme':'user','network':network,'action':original,'nonce':nonce,
            'wireAction':action,'digest':observer.digest,'sdkRecovered':recovered})
    # Exercise the real Exchange path: no vault => no subaccount suffix.
    for name, amount, to_perp in [('to-perp',49,True), ('to-spot',1.000001,False), ('minimum',Decimal('0.000001'),True)]:
        observer = DigestObserver()
        client = exchange.Exchange.__new__(exchange.Exchange)
        client.wallet = observer
        client.vault_address = None
        client.base_url = exchange.MAINNET_API_URL if network == 'mainnet' else 'https://api.hyperliquid-testnet.xyz'
        client._post_action = lambda wire, signature, timestamp: copy.deepcopy(wire)
        with patch.object(exchange, 'get_timestamp_ms', return_value=nonce):
            wire = client.usd_class_transfer(amount, to_perp)
        original = {k:v for k,v in wire.items() if k not in ['hyperliquidChain','signatureChainId']}
        recovered = signing.recover_user_from_user_signed_action(wire, public_signature, signing.USD_CLASS_TRANSFER_SIGN_TYPES,
            'HyperliquidTransaction:UsdClassTransfer', network=='mainnet').lower()
        vectors.append({'name':network+'-usdClassTransfer-'+name,'scheme':'user','network':network,'action':original,
            'nonce':nonce,'wireAction':wire,'digest':observer.digest,'sdkRecovered':recovered})
result = {'provenance':{'repository':'https://github.com/hyperliquid-dex/hyperliquid-python-sdk','sdkVersion':'0.24.0',
  'commit':SDK_COMMIT,'signingPySha256':SDK_SOURCE_SHA256,'exchangePySha256':SDK_EXCHANGE_SHA256,
  'classTransferWireMethod':'Exchange.usd_class_transfer with vault_address=None and fixed timestamp; no suffix for same-account transfers','generator':'contracts/policy/tools/generate-signing-vectors.py',
  'method':'Official sign_* entrypoints intercepted at wallet.sign_message; keccak(0x19 || version || domain separator || struct hash)',
  'recoveryMethod':'Official SDK recover_* for every vector using an already-public MPC signature on unrelated digests; recovered addresses are codec parity checks, not our signer.',
  'agentWireMethod':'Exchange.approve_agent with entropy/account construction replaced by public-address-only stubs',
  'expectedSignatures':'Omitted to respect the blanket prohibition on handling private keys, including published test keys.'},'vectors':vectors}
Path('contracts/policy/fixtures/hyperliquid-signing-vectors.json').write_text(json.dumps(result,indent=2)+'\n')
print(f'Generated {len(vectors)} official SDK digest vectors; no keys used.')
