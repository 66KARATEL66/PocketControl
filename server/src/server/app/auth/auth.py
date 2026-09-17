from uuid import uuid4
import json
import zlib
import qrcode
import server.app.auth.network as network
import io


rand_token = str(uuid4())
server_ip = network.get_server_url()

AUTHDATA = {
    "token": rand_token,
    "ip": server_ip,
    "request": "/api/v1/auth"
}

def compress_and_encode(data):
    # print(data["token"])
    authdata_str = json.dumps(data)

    compressed_data = zlib.compress(
        authdata_str.encode("utf-8")
    )

    return compressed_data.hex()

def create_qr_code():
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=1,
        border=4,
    )
    qr.clear()
    qr.add_data(compress_and_encode(AUTHDATA))
    qr.make(fit=True)

    f = io.StringIO()
    qr.print_ascii(out=f)
    f.seek(0)
    print(f.read())

create_qr_code()