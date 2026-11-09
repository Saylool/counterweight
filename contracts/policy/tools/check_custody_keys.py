"""Read-only funding preflight. Does not load, generate, or print private keys."""
import argparse
import json
import urllib.request


def assert_keyless(result):
    keys = result.get("keys")
    if not isinstance(keys, list) or keys:
        raise ValueError("Funding blocked: strategy account must have zero access keys")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rpc", required=True)
    parser.add_argument("--account", required=True)
    args = parser.parse_args()
    request = urllib.request.Request(args.rpc, data=json.dumps({
        "jsonrpc": "2.0", "id": "counterweight-custody", "method": "query",
        "params": {"request_type": "view_access_key_list", "finality": "final", "account_id": args.account},
    }).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = json.load(response)
    assert_keyless(payload["result"])
    print("custody preflight: zero access keys at finalized block; funding gate passed")
