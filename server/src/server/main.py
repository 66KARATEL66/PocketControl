import uvicorn

from server.app.auth.auth import create_qr_code
from server.app.services.logger import logger


def main():
    logger.info("Starting PocketControl and generating pairing QR code")
    create_qr_code()
    uvicorn.run("server.app.api.serverHandler:app", host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()