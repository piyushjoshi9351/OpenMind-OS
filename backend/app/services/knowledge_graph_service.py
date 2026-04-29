from __future__ import annotations

import json
from typing import Any

import networkx as nx


class KnowledgeGraphService:
    """
    Knowledge Graph for tracking skills, prerequisites, and relationships.
    Uses NetworkX to build a directed graph of skills and their dependencies.
    """

    def __init__(self) -> None:
        self.graph: nx.DiGraph = nx.DiGraph()
        self._initialize_default_skills()

    def _initialize_default_skills(self) -> None:
        """Initialize with pre-built skill relationships (20+ edges)."""
        # Core programming languages
        self.add_skill("Python", category="language")
        self.add_skill("JavaScript", category="language")
        self.add_skill("TypeScript", category="language")
        self.add_skill("Java", category="language")
        self.add_skill("SQL", category="language")

        # Frontend skills
        self.add_skill("React", category="frontend")
        self.add_skill("Vue.js", category="frontend")
        self.add_skill("Angular", category="frontend")
        self.add_skill("HTML/CSS", category="frontend")

        # Backend skills
        self.add_skill("FastAPI", category="backend")
        self.add_skill("Django", category="backend")
        self.add_skill("Node.js", category="backend")
        self.add_skill("Express.js", category="backend")

        # ML/AI skills
        self.add_skill("Machine Learning", category="ai")
        self.add_skill("Deep Learning", category="ai")
        self.add_skill("TensorFlow", category="ai")
        self.add_skill("PyTorch", category="ai")
        self.add_skill("NLP", category="ai")

        # Data skills
        self.add_skill("Data Analysis", category="data")
        self.add_skill("Data Science", category="data")
        self.add_skill("Pandas", category="data")
        self.add_skill("SQL", category="data")

        # DevOps/Infrastructure
        self.add_skill("Docker", category="devops")
        self.add_skill("Kubernetes", category="devops")
        self.add_skill("AWS", category="devops")
        self.add_skill("CI/CD", category="devops")

        # Pre-requisite relationships (edges: A → B means "B depends on A" or "A leads to B")
        prerequisites = [
            ("Python", "Machine Learning"),
            ("Python", "Data Science"),
            ("Python", "PyTorch"),
            ("Python", "TensorFlow"),
            ("Machine Learning", "Deep Learning"),
            ("Machine Learning", "NLP"),
            ("Deep Learning", "TensorFlow"),
            ("Deep Learning", "PyTorch"),
            ("Data Analysis", "Data Science"),
            ("Data Analysis", "Machine Learning"),
            ("SQL", "Data Analysis"),
            ("Pandas", "Data Science"),
            ("JavaScript", "React"),
            ("JavaScript", "Vue.js"),
            ("JavaScript", "Angular"),
            ("JavaScript", "Node.js"),
            ("TypeScript", "Angular"),
            ("HTML/CSS", "React"),
            ("HTML/CSS", "Vue.js"),
            ("Node.js", "Express.js"),
            ("Express.js", "FastAPI"),
            ("Java", "Spring Boot"),
            ("Docker", "Kubernetes"),
            ("Docker", "CI/CD"),
            ("CI/CD", "AWS"),
            ("FastAPI", "Backend Development"),
            ("React", "Frontend Development"),
            ("Machine Learning", "Data Science"),
        ]

        for source, target in prerequisites:
            self.link_skills(source, target)

    def add_skill(
        self, skill_name: str, category: str = "general", description: str | None = None
    ) -> None:
        """Add a skill node to the graph."""
        self.graph.add_node(
            skill_name,
            category=category,
            description=description or skill_name,
            type="skill",
        )

    def link_skills(self, source_skill: str, target_skill: str, strength: float = 1.0) -> None:
        """Create a directed edge: source_skill → target_skill (prerequisite relationship)."""
        # Ensure both skills exist
        if source_skill not in self.graph:
            self.add_skill(source_skill)
        if target_skill not in self.graph:
            self.add_skill(target_skill)

        self.graph.add_edge(source_skill, target_skill, weight=strength)

    def add_goal(self, goal_id: int, goal_title: str, required_skills: list[str]) -> None:
        """Add a goal node and link it to required skills."""
        goal_node = f"goal_{goal_id}"
        self.graph.add_node(goal_node, type="goal", title=goal_title)

        for skill in required_skills:
            if skill not in self.graph:
                self.add_skill(skill)
            self.graph.add_edge(skill, goal_node, relation="enables")

    def get_skill_prerequisites(self, skill_name: str) -> list[str]:
        """Get all prerequisites (incoming edges) for a skill."""
        if skill_name not in self.graph:
            return []

        # Find all nodes that have edges pointing to this skill
        return list(self.graph.predecessors(skill_name))

    def get_skill_dependents(self, skill_name: str) -> list[str]:
        """Get all skills that depend on this skill (outgoing edges)."""
        if skill_name not in self.graph:
            return []

        # Find all nodes this skill points to
        return list(self.graph.successors(skill_name))

    def find_skill_gap(
        self, required_skills: list[str], user_current_skills: list[str]
    ) -> dict[str, Any]:
        """
        Analyze skill gap between required skills and user's current skills.
        Returns missing skills and their prerequisites.
        """
        required_set = set(required_skills)
        current_set = set(user_current_skills)
        missing_skills = required_set - current_set

        # For each missing skill, find its prerequisites that user doesn't have
        learning_path: list[str] = []
        prerequisites_map: dict[str, list[str]] = {}

        for skill in missing_skills:
            prereqs = self.get_skill_prerequisites(skill)
            missing_prereqs = [p for p in prereqs if p not in current_set and p not in missing_skills]
            prerequisites_map[skill] = missing_prereqs
            learning_path.append(skill)

        return {
            "missing_skills": list(missing_skills),
            "learning_path": learning_path,
            "prerequisites_by_skill": prerequisites_map,
            "total_gap": len(missing_skills),
        }

    def get_learning_path(self, target_skill: str, user_current_skills: list[str]) -> list[str]:
        """Get recommended learning path to reach target skill (topological sort)."""
        if target_skill not in self.graph:
            return []

        current_set = set(user_current_skills)
        path: list[str] = []

        # BFS to find all nodes that lead to target_skill
        to_visit = [target_skill]
        visited = set()

        while to_visit:
            node = to_visit.pop(0)
            if node in visited or node.startswith("goal_"):
                continue

            visited.add(node)
            prereqs = self.get_skill_prerequisites(node)

            for prereq in prereqs:
                if prereq not in current_set and not prereq.startswith("goal_"):
                    path.append(prereq)
                    if prereq not in visited:
                        to_visit.append(prereq)

        # Reverse to get learning order (prerequisites first)
        return list(reversed(path))

    def get_graph_json(self) -> dict[str, Any]:
        """Export graph as JSON (nodes and edges) for visualization."""
        nodes = []
        edges = []

        for node, attrs in self.graph.nodes(data=True):
            nodes.append(
                {
                    "id": node,
                    "label": node,
                    "type": attrs.get("type", "unknown"),
                    "category": attrs.get("category", "general"),
                }
            )

        for source, target, attrs in self.graph.edges(data=True):
            edges.append(
                {
                    "source": source,
                    "target": target,
                    "weight": attrs.get("weight", 1.0),
                    "relation": attrs.get("relation", "prerequisite"),
                }
            )

        return {
            "nodes": nodes,
            "edges": edges,
            "node_count": self.graph.number_of_nodes(),
            "edge_count": self.graph.number_of_edges(),
        }

    def get_all_skills(self) -> list[str]:
        """Get all skill names (exclude goal nodes)."""
        return [node for node in self.graph.nodes() if not node.startswith("goal_")]

    def get_skills_by_category(self, category: str) -> list[str]:
        """Get all skills in a category."""
        skills = []
        for node, attrs in self.graph.nodes(data=True):
            if attrs.get("category") == category and not node.startswith("goal_"):
                skills.append(node)
        return skills


# Global singleton instance
knowledge_graph = KnowledgeGraphService()
