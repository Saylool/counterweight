"""Digest-only oracle. Does not instantiate an account or load/create any signing key."""
import copy
import hashlib
import importlib.metadata
import json
from pathlib import Path
from eth_utils import keccak
from hyperliquid.utils import signing

SDK_COMMIT = '2fdb18f9517675ea03695a0962bd19eece9c83f0'
SDK_SOURCE_SHA256 = '938ec0a1f9611874b423ca946696e19a71d32d14709f521ea5d526f4398c0b85'
assert importlib.metadata.version('hyperliquid-python-sdk') == '0.24.0'
assert hashlib.sha256(Path(signing.__file__).read_bytes()).hexdigest() == SDK_SOURCE_SHA256

class Captured(Exception):
    pass

class DigestObserver:
    def sign_message(self, message):
        # Intercept the official SDK immediately before its signing boundary.
        self.digest = '0x' + keccak(b'\x19' + message.version + message.header + message.body).hex()
        raise Captured()

nonce = 1700000000123
addr = '0x1234567890123456789012345678901234567890'
order = {'type':'order', 'orders':[{'a':54,'b':False,'p':'1.25','s':'10','r':False,'t':{'limit':{'tif':'Alo'}}}], 'grouping':'na'}
trigger = {'type':'order','orders':[{'a':54,'b':True,'p':'10','s':'1.2','r':True,'t':{'trigger':{'isMarket':True,'triggerPx':'9.5','tpsl':'sl'}},'c':'0x1234567890abcdef1234567890abcdef'}],'grouping':'positionTpsl'}
cancel = {'type':'cancel','cancels':[{'a':54,'o':1234567890123}]}
cloid = {'type':'cancelByCloid','cancels':[{'asset':54,'cloid':'0x1234567890abcdef1234567890abcdef'}]}
vectors = []
for network in ['testnet', 'mainnet']:
    for name, action, vault, expiry in [
        ('order',order,None,None), ('trigger',trigger,None,None), ('cancel',cancel,None,None),
        ('cloid',cloid,None,None), ('vault',order,addr,None), ('expiry',cancel,None,nonce+60000),
        ('vault-expiry',order,addr,nonce+60000),
        ('msgpack-boundaries',{'type':'cancel','cancels':[{'a':x,'o':x} for x in [0,127,128,255,256,65535,65536,4294967295,4294967296,9007199254740991]]},None,None),
    ]:
        observer = DigestObserver()
        try: signing.sign_l1_action(observer, action, vault, nonce, expiry, network=='mainnet')
        except Captured: pass
        vectors.append({'name':network+'-'+name, 'scheme':'l1','network':network,'action':copy.deepcopy(action),'nonce':nonce,
          **({'vaultAddress':vault} if vault else {}), **({'expiresAfter':expiry} if expiry else {}),
          'actionHash':'0x'+signing.action_hash(action,vault,nonce,expiry).hex(), 'digest':observer.digest})
    for name, action, fn in [
        ('approveAgent',{'type':'approveAgent','agentAddress':addr,'agentName':'counterweight-test','nonce':nonce}, signing.sign_agent),
        ('approveAgent-empty-name',{'type':'approveAgent','agentAddress':addr,'agentName':'','nonce':nonce}, signing.sign_agent),
        ('withdraw3',{'type':'withdraw3','destination':addr,'amount':'1.000001','time':nonce},signing.sign_withdraw_from_bridge_action),
        ('usdSend',{'type':'usdSend','destination':addr,'amount':'1','time':nonce},signing.sign_usd_transfer_action),
    ]:
        original = copy.deepcopy(action)
        observer = DigestObserver()
        try: fn(observer,action,network=='mainnet')
        except Captured: pass
        vectors.append({'name':network+'-'+name,'scheme':'user','network':network,'action':original,'nonce':nonce,
            'wireAction':action,'digest':observer.digest})
result = {'provenance':{'repository':'https://github.com/hyperliquid-dex/hyperliquid-python-sdk','sdkVersion':'0.24.0',
  'commit':SDK_COMMIT,'signingPySha256':SDK_SOURCE_SHA256,'generator':'scripts/generate-signing-vectors.py',
  'method':'Official sign_* entrypoints intercepted at wallet.sign_message; keccak(0x19 || version || domain separator || struct hash)',
  'expectedSignatures':'Omitted to respect the blanket prohibition on handling private keys, including published test keys.'},'vectors':vectors}
Path('fixtures/hyperliquid-signing-vectors.json').write_text(json.dumps(result,indent=2)+'\n')
print(f'Generated {len(vectors)} official SDK digest vectors; no keys used.')
