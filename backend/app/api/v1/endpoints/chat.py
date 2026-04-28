from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.chat_schemas import ChatHistoryResponse, ChatRequest, ChatResponse, ChatMessageRead
from app.database import get_db
from app.services.chat_service import chat_service


router = APIRouter()


@router.post("", response_model=ChatResponse)
def send_chat_message(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    result = chat_service.send_message(db=db, message=payload.message, conversation_id=payload.conversation_id)
    return ChatResponse(conversation_id=result.conversation_id, assistant_message=result.assistant_message)


@router.get("/{conversation_id}", response_model=ChatHistoryResponse)
def get_chat_history(conversation_id: str, db: Session = Depends(get_db)) -> ChatHistoryResponse:
    messages = chat_service.get_history(db=db, conversation_id=conversation_id)
    if not messages:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ChatHistoryResponse(
        conversation_id=conversation_id,
        messages=[ChatMessageRead.model_validate(message) for message in messages],
    )