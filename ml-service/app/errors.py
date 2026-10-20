"""One friendly error envelope: {"error": {"code", "message", "details"}}"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.questionnaire import BY_ID, QUESTIONS


class ApiError(Exception):
    def __init__(self, status, code, message, details=None):
        self.status, self.code, self.message, self.details = status, code, message, details


def _body(code, message, details=None):
    return {"error": {"code": code, "message": message, "details": details}}


def _friendly(err):
    """Turn a pydantic error into a sentence a normal user (or a frontend) can show."""
    loc = [str(x) for x in err["loc"]]
    qid = loc[-1] if loc else ""
    if err["type"] == "extra_forbidden" and "answers" not in loc:
        return {"field": ".".join(loc[1:]), "message": f"'{qid}' is not a recognised field here."}
    if err["type"] == "extra_forbidden":
        return {"field": qid, "message": f"'{qid}' is not a known question. Valid ids: {', '.join(q['id'] for q in QUESTIONS)}."}
    q = BY_ID.get(qid)
    if q and err["type"] == "literal_error":
        opts = [c["value"] for c in __import__("app.questionnaire", fromlist=["choices"]).choices(q)]
        return {"field": qid, "message": f"Please choose one of: {', '.join(opts)}."}
    if q and q["type"] == "number":
        return {"field": qid, "message": f"Age must be a whole number between {q['min']} and {q['max']}."}
    return {"field": ".".join(loc[1:]) or qid, "message": err["msg"]}


def install(app: FastAPI):
    @app.exception_handler(ApiError)
    async def _api(_: Request, e: ApiError):
        return JSONResponse(_body(e.code, e.message, e.details), status_code=e.status)

    @app.exception_handler(RequestValidationError)
    async def _val(_: Request, e: RequestValidationError):
        return JSONResponse(_body("invalid_answers", "Some answers could not be understood.",
                                  [_friendly(x) for x in e.errors()]), status_code=422)

    @app.exception_handler(HTTPException)
    async def _http(_: Request, e: HTTPException):
        return JSONResponse(_body("http_error", str(e.detail)), status_code=e.status_code)
