from neo4j import GraphDatabase
from typing import Optional, List, Dict, Any
import logging

from app.core.config import get_settings


settings = get_settings()
logger = logging.getLogger(__name__)


def get_driver():
    return GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_username, settings.neo4j_password),
    )


class Neo4jGraphService:
    """Service for managing knowledge graph in Neo4j."""
    
    def __init__(self):
        self.driver = get_driver()
    
    def close(self):
        """Close the Neo4j driver connection."""
        self.driver.close()
    
    def create_knowledge_node(
        self,
        node_id: str,
        content: str,
        category: str,
        embedding: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Create a knowledge node in the graph.
        
        Args:
            node_id: Unique identifier for the node
            content: Text content of the node
            category: Category of knowledge (skill, concept, insight, goal, etc.)
            embedding: Vector embedding of the content
            metadata: Additional metadata
        
        Returns:
            True if successful, False otherwise
        """
        
        try:
            with self.driver.session() as session:
                # Create or merge the knowledge node
                query = """
                MERGE (k:Knowledge {id: $id})
                SET k.content = $content,
                    k.category = $category,
                    k.updatedAt = datetime(),
                    k.metadata = $metadata
                RETURN k
                """
                
                session.run(
                    query,
                    id=node_id,
                    content=content,
                    category=category,
                    metadata=metadata or {}
                )
                
                logger.info(f"Created knowledge node: {node_id}")
                return True
        
        except Exception as e:
            logger.error(f"Error creating knowledge node: {e}")
            return False
    
    def create_relationship(
        self,
        source_id: str,
        target_id: str,
        relationship_type: str,
        properties: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Create a relationship between two knowledge nodes.
        
        Args:
            source_id: ID of source node
            target_id: ID of target node
            relationship_type: Type of relationship (RELATED_TO, PREREQUISITE, IMPROVES, etc.)
            properties: Additional properties for the relationship
        
        Returns:
            True if successful, False otherwise
        """
        
        try:
            with self.driver.session() as session:
                query = f"""
                MATCH (source:Knowledge {{id: $source_id}}),
                      (target:Knowledge {{id: $target_id}})
                MERGE (source)-[r:{relationship_type}]->(target)
                SET r.properties = $properties,
                    r.createdAt = datetime()
                RETURN r
                """
                
                session.run(
                    query,
                    source_id=source_id,
                    target_id=target_id,
                    properties=properties or {}
                )
                
                logger.info(f"Created relationship: {source_id} -{relationship_type}-> {target_id}")
                return True
        
        except Exception as e:
            logger.error(f"Error creating relationship: {e}")
            return False
    
    def get_related_nodes(
        self,
        node_id: str,
        relationship_type: Optional[str] = None,
        depth: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Get all related nodes from a given node.
        
        Args:
            node_id: ID of the source node
            relationship_type: Optional filter by relationship type
            depth: How many levels deep to traverse (1-3)
        
        Returns:
            List of related nodes with relationships
        """
        
        try:
            with self.driver.session() as session:
                # Build the query with depth
                depth = max(1, min(depth, 3))  # Limit to 1-3
                rel_filter = f":{relationship_type}" if relationship_type else ""
                
                query = f"""
                MATCH (source:Knowledge {{id: $id}})-[r{rel_filter}*..{depth}]->(related:Knowledge)
                RETURN DISTINCT related.id as id, related.content as content, 
                       related.category as category, related.metadata as metadata
                LIMIT 50
                """
                
                result = session.run(query, id=node_id)
                nodes = [dict(record) for record in result]
                
                return nodes
        
        except Exception as e:
            logger.error(f"Error getting related nodes: {e}")
            return []
    
    def search_by_category(
        self,
        category: str,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search for knowledge nodes by category.
        
        Args:
            category: Category to search for
            limit: Maximum number of results
        
        Returns:
            List of matching nodes
        """
        
        try:
            with self.driver.session() as session:
                query = """
                MATCH (k:Knowledge {category: $category})
                RETURN k.id as id, k.content as content, 
                       k.category as category, k.metadata as metadata
                ORDER BY k.updatedAt DESC
                LIMIT $limit
                """
                
                result = session.run(query, category=category, limit=limit)
                nodes = [dict(record) for record in result]
                
                return nodes
        
        except Exception as e:
            logger.error(f"Error searching by category: {e}")
            return []
    
    def get_graph_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the knowledge graph.
        
        Returns:
            Dictionary with node and relationship counts
        """
        
        try:
            with self.driver.session() as session:
                # Count nodes by category
                node_query = """
                MATCH (k:Knowledge)
                WITH k.category as category, COUNT(k) as count
                RETURN category, count
                ORDER BY count DESC
                """
                
                # Count relationships by type
                rel_query = """
                MATCH ()-[r]->()
                WITH type(r) as rel_type, COUNT(r) as count
                RETURN rel_type, count
                ORDER BY count DESC
                """
                
                node_result = session.run(node_query)
                rel_result = session.run(rel_query)
                
                categories = {record["category"]: record["count"] for record in node_result}
                relationships = {record["rel_type"]: record["count"] for record in rel_result}
                
                return {
                    "nodesByCategory": categories,
                    "relationshipsByType": relationships,
                    "totalNodes": sum(categories.values()) if categories else 0,
                    "totalRelationships": sum(relationships.values()) if relationships else 0,
                }
        
        except Exception as e:
            logger.error(f"Error getting graph stats: {e}")
            return {}


# Singleton instance
_graph_service: Optional[Neo4jGraphService] = None


def get_graph_service() -> Neo4jGraphService:
    """Get or create the Neo4j graph service instance."""
    global _graph_service
    if _graph_service is None:
        _graph_service = Neo4jGraphService()
    return _graph_service

