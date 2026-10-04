"""POST /ask – a farmer question in, an advisory answer out."""
from fastapi import APIRouter, Depends

from app.ai.pipeline import answer_question
from app.core.security import verify_api_key
from app.schemas.ask import AskRequest, AskResponse

router = APIRouter(tags=["advisory"])


@router.post("/ask", response_model=AskResponse, dependencies=[Depends(verify_api_key)])
def ask(req: AskRequest) -> AskResponse:
    return answer_question(req)
