from app.models.schemas import SimulationRequest, SimulationResponse


class SimulationService:
    def simulate(self, payload: SimulationRequest) -> SimulationResponse:
        scenario = payload.scenario.lower()
        if "career" in scenario:
            return SimulationResponse(risk_factor=42.0, opportunity_cost="medium", estimated_months=9)
        if "startup" in scenario:
            return SimulationResponse(risk_factor=63.0, opportunity_cost="high", estimated_months=14)
        return SimulationResponse(risk_factor=35.0, opportunity_cost="low", estimated_months=6)


simulation_service = SimulationService()
