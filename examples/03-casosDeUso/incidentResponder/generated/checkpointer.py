from config import DB_URI
import contextlib
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient


@contextlib.asynccontextmanager
async def generate_checkpointer():
    client = MongoClient(DB_URI)
    try:
        checkpointer = MongoDBSaver(client)
        yield checkpointer
    finally:
        client.close()