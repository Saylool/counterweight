import unittest
from check_custody_keys import assert_keyless


class CustodyGate(unittest.TestCase):
    def test_rejects_full_and_function_call_keys(self):
        for permission in ["FullAccess", {"FunctionCall": {"receiver_id": "v1.signer-prod.testnet", "method_names": ["sign"]}}]:
            with self.assertRaises(ValueError):
                assert_keyless({"keys": [{"access_key": {"permission": permission}}]})
        assert_keyless({"keys": []})


if __name__ == "__main__":
    unittest.main()
