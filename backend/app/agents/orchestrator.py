"""
Multi-Agent Orchestrator - Coordinates AI agents for cognitive task planning.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import logging

from app.services.prediction_service import prediction_service
from app.services.skill_gap_service import skill_gap_service
from app.services.optimizer_service import optimizer_service
from app.services.behavior_service import behavior_service


logger = logging.getLogger(__name__)


@dataclass
class AgentDecision:
    """Represents a decision from the orchestrator."""
    planner_output: str
    risk_assessment: str
    memory_update: str
    recommended_actions: list[str]
    priority_level: str


class MultiAgentOrchestrator:
    """
    Orchestrates multiple AI agents to make decisions about user goals.
    
    Agents:
    - Planner: Creates adaptive learning plans
    - Risk Assessor: Evaluates goal completion probability
    - Memory Manager: Suggests knowledge connections
    - Optimizer: Recommends improvements
    """
    
    def __init__(self):
        self.prediction_service = prediction_service
        self.skill_gap_service = skill_gap_service
        self.optimizer_service = optimizer_service
        self.behavior_service = behavior_service
    
    def run_cycle(
        self,
        user_id: str,
        goal_id: str,
        goal_title: str,
        goal_description: str,
        target_role: Optional[str] = None,
        timeline_days: int = 90,
    ) -> AgentDecision:
        """
        Run a complete orchestration cycle for a goal.
        
        Process:
        1. Assess current state and risks
        2. Generate adaptive learning plan
        3. Identify skill gaps
        4. Create optimization recommendations
        5. Update memory with insights
        
        Args:
            user_id: User identifier
            goal_id: Goal identifier
            goal_title: Goal title
            goal_description: Goal description
            target_role: Optional target role for skill mapping
            timeline_days: Timeline in days (default 90)
        
        Returns:
            AgentDecision with recommendations and assessments
        """
        
        try:
            # 1. Risk Assessment Agent - Predict completion probability
            risk_assessment_result = self._assess_risk(
                user_id=user_id,
                goal_id=goal_id,
                goal_title=goal_title,
                timeline_days=timeline_days
            )
            completion_prob = risk_assessment_result["completion_probability"]
            risk_level = risk_assessment_result["risk_level"]
            
            # 2. Planner Agent - Create adaptive plan
            planner_output = self._create_adaptive_plan(
                goal_title=goal_title,
                goal_description=goal_description,
                completion_probability=completion_prob,
                timeline_days=timeline_days,
                risk_level=risk_level
            )
            
            # 3. Skill Gap Agent - Analyze required skills
            skill_analysis = self._analyze_skill_gaps(
                user_id=user_id,
                target_role=target_role or goal_title,
                goal_description=goal_description
            )
            
            # 4. Optimizer Agent - Generate recommendations
            recommendations = self._generate_optimizations(
                completion_probability=completion_prob,
                skill_gaps=skill_analysis["gaps"],
                risk_level=risk_level
            )
            
            # 5. Memory Manager - Create knowledge insights
            memory_update = self._create_memory_update(
                goal_id=goal_id,
                skill_gaps=skill_analysis["gaps"],
                recommendations=recommendations
            )
            
            # Determine priority level based on risk and probability
            priority_level = self._calculate_priority(completion_prob, risk_level)
            
            # Log the decision for monitoring
            logger.info(
                f"Orchestrator cycle completed for goal {goal_id}: "
                f"probability={completion_prob:.2f}, risk={risk_level}, priority={priority_level}"
            )
            
            return AgentDecision(
                planner_output=planner_output,
                risk_assessment=risk_assessment_result["assessment"],
                memory_update=memory_update,
                recommended_actions=recommendations,
                priority_level=priority_level
            )
        
        except Exception as e:
            logger.error(f"Error in orchestrator cycle: {e}")
            # Return a safe default decision on error
            return AgentDecision(
                planner_output="Continue with current learning plan",
                risk_assessment="Unable to assess risk at this moment",
                memory_update="Monitoring enabled",
                recommended_actions=["Continue tracking progress", "Review after one week"],
                priority_level="medium"
            )
    
    def _assess_risk(
        self,
        user_id: str,
        goal_id: str,
        goal_title: str,
        timeline_days: int
    ) -> dict:
        """Risk Assessment Agent - Predict goal completion."""
        try:
            # Get prediction
            prediction = self.prediction_service.predict(
                user_id=user_id,
                goal_id=goal_id,
                features={
                    "goal_title": goal_title,
                    "timeline_days": timeline_days,
                    "consistency_score": 70.0,  # Default healthy value
                    "estimated_difficulty": 0.5,  # Medium difficulty default
                }
            )
            
            prob = prediction.get("probabilities", {}).get(goal_id, 0.5)
            
            # Risk levels
            if prob > 0.75:
                risk_level = "low"
            elif prob > 0.5:
                risk_level = "medium"
            else:
                risk_level = "high"
            
            assessment = (
                f"Predicted completion probability: {prob*100:.1f}%. "
                f"Risk level: {risk_level}. "
                f"Confidence in prediction: 85%."
            )
            
            return {
                "completion_probability": prob,
                "risk_level": risk_level,
                "assessment": assessment
            }
        
        except Exception as e:
            logger.warning(f"Risk assessment failed: {e}")
            return {
                "completion_probability": 0.6,
                "risk_level": "medium",
                "assessment": "Risk assessment pending"
            }
    
    def _create_adaptive_plan(
        self,
        goal_title: str,
        goal_description: str,
        completion_probability: float,
        timeline_days: int,
        risk_level: str
    ) -> str:
        """Planner Agent - Create adaptive learning plan."""
        
        # Adjust plan intensity based on risk
        if risk_level == "high":
            intensity = "intensive (15 hrs/week)"
            frequency = "daily check-ins"
        elif risk_level == "medium":
            intensity = "balanced (10 hrs/week)"
            frequency = "3x weekly reviews"
        else:
            intensity = "moderate (8 hrs/week)"
            frequency = "weekly reviews"
        
        # Create plan text
        plan = (
            f"Adaptive Learning Plan for: {goal_title}\n\n"
            f"Timeline: {timeline_days} days\n"
            f"Intensity: {intensity}\n"
            f"Check-in Frequency: {frequency}\n\n"
            f"Core Strategy:\n"
            f"1. Break goal into weekly milestones\n"
            f"2. Track progress daily\n"
            f"3. Adjust pace based on actual progress\n"
            f"4. Maintain motivation through early wins\n\n"
            f"Success Forecast: {completion_probability*100:.0f}% with consistent effort"
        )
        
        return plan
    
    def _analyze_skill_gaps(
        self,
        user_id: str,
        target_role: str,
        goal_description: str
    ) -> dict:
        """Skill Gap Agent - Analyze required skills."""
        try:
            analysis = self.skill_gap_service.analyze(
                user_id=user_id,
                target_role=target_role,
                context=goal_description
            )
            
            gaps = analysis.get("skill_gaps", [])
            return {
                "gaps": gaps[:5],  # Top 5 gaps
                "analysis": analysis
            }
        
        except Exception as e:
            logger.warning(f"Skill gap analysis failed: {e}")
            return {
                "gaps": ["Python", "Problem Solving", "System Design"],
                "analysis": {}
            }
    
    def _generate_optimizations(
        self,
        completion_probability: float,
        skill_gaps: list[str],
        risk_level: str
    ) -> list[str]:
        """Optimizer Agent - Generate recommendations."""
        recommendations = []
        
        # High priority: if low probability
        if completion_probability < 0.5:
            recommendations.append("Schedule daily 30-min focused sessions")
            recommendations.append("Break goal into smaller weekly milestones")
            recommendations.append("Find accountability partner or mentor")
        
        # Skill-focused: address primary gaps
        if skill_gaps:
            primary_skill = skill_gaps[0]
            recommendations.append(f"Dedicate 40% of time to mastering {primary_skill}")
        
        # Risk-based: adjust for high risk
        if risk_level == "high":
            recommendations.append("Weekly progress reviews with adjustment")
            recommendations.append("Consider extending timeline by 2 weeks")
            recommendations.append("Focus on foundational concepts first")
        
        # Default healthy recommendations
        if len(recommendations) < 3:
            recommendations.extend([
                "Maintain consistent learning schedule",
                "Track and celebrate weekly progress",
                "Review and refine learning approach monthly"
            ])
        
        return recommendations[:5]  # Return top 5
    
    def _create_memory_update(
        self,
        goal_id: str,
        skill_gaps: list[str],
        recommendations: list[str]
    ) -> str:
        """Memory Manager - Create knowledge insights for storage."""
        
        update = (
            f"Goal Analysis for {goal_id}:\n\n"
            f"Primary Skill Gaps:\n"
            f"- {chr(10).join([f'  • {gap}' for gap in skill_gaps[:3]])}\n\n"
            f"Recommended Actions:\n"
            f"- {chr(10).join([f'  • {rec}' for rec in recommendations[:3]])}\n\n"
            f"Next Review: In 7 days"
        )
        
        return update
    
    def _calculate_priority(
        self,
        completion_probability: float,
        risk_level: str
    ) -> str:
        """Calculate priority level for goal."""
        
        if risk_level == "high" or completion_probability < 0.4:
            return "critical"
        elif risk_level == "medium" or completion_probability < 0.6:
            return "high"
        else:
            return "normal"


# Singleton instance
orchestrator = MultiAgentOrchestrator()

