from neo4j import GraphDatabase

from app.core.config import get_settings


settings = get_settings()


def get_driver():
    return GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_username, settings.neo4j_password),
    )
