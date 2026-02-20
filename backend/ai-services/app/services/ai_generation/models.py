from pydantic import BaseModel, Field
from typing import List


class TestCaseOut(BaseModel):
    inputData: str
    expectedOutput: str
    exampleCase: bool


class QuestionOut(BaseModel):
    description: str
    complexity: str
    testCases: List[TestCaseOut]
    aiSolution: str


class AIGenerateResponse(BaseModel):
    questions: List[QuestionOut]


class AIGenerateRequest(BaseModel):
    topic: str
    difficulty: str = Field(pattern="^(Easy|Medium|Hard)$")
    numberOfQuestions: int = Field(gt=0, le=10)
