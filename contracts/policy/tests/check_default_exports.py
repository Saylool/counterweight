"""Key-free Wasm export check; run against the default signing-disabled build."""
import pathlib
import sys


def read_u32(data, offset):
    value = shift = 0
    while True:
        byte = data[offset]
        offset += 1
        value |= (byte & 127) << shift
        if byte < 128:
            return value, offset
        shift += 7
        assert shift <= 28, "invalid Wasm integer"


data = pathlib.Path(sys.argv[1]).read_bytes()
assert data[:8] == b"\0asm\x01\0\0\0", "invalid Wasm header"
offset, exports = 8, set()
while offset < len(data):
    section = data[offset]
    length, start = read_u32(data, offset + 1)
    offset = start + length
    if section != 7:
        continue
    count, cursor = read_u32(data, start)
    for _ in range(count):
        size, cursor = read_u32(data, cursor)
        exports.add(data[cursor:cursor + size].decode())
        cursor += size + 1  # skip name and export kind
        _, cursor = read_u32(data, cursor)

required = {
    "new", "get_state", "set_config", "set_reference_price", "set_paused",
    "heartbeat", "ft_on_transfer", "request_order_signature", "deleverage",
    "request_evm_withdrawal", "withdraw_spot", "on_signature",
    "on_spot_withdrawal", "acknowledge_failed_signature",
}
forbidden = {
    "sign", "sign_digest", "sign_hash", "request_signature", "upgrade",
    "migrate", "set_owner", "set_market", "set_derivation_path", "set_recipients",
    "usdSend", "spotSend", "approveAgent",
}
assert required <= exports, f"missing entry points: {required - exports}"
assert not forbidden & exports, f"forbidden entry points: {forbidden & exports}"
assert not any(name.startswith("test_only_") for name in exports), "test setter leaked"
print(f"default Wasm exports: ok; {len(required)} required methods; no test-only or raw-signing methods")
