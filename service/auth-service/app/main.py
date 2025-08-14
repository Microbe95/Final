"""
Auth Service 메인 파일 - 서브라우터 역할
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
import sys
from dotenv import load_dotenv

# 환경 변수 로드
if os.getenv("RAILWAY_ENVIRONMENT") != "true":
    load_dotenv()

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("auth_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    logger.info("🔐 Auth Service 시작 (서브라우터 모드)")
    yield
    logger.info("🛑 Auth Service 종료")

# FastAPI 앱 생성
app = FastAPI(
    title="Auth Service",
    description="사용자 인증 및 회원가입 서비스 (서브라우터)",
    version="1.0.0",
    docs_url="/docs",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # 로컬 프론트엔드
        "http://127.0.0.1:3000",  # 로컬 IP 접근
        "http://frontend:3000",   # Docker 내부 네트워크
        "https://lca-final.vercel.app",  # Vercel 프론트엔드
        "https://lca-final-9th3dtaxw-microbe95s-projects.vercel.app",  # 실제 Vercel 도메인
        "http://gateway:8080",  # Gateway 서비스
        "http://localhost:8080",  # 로컬 Gateway
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 직접 엔드포인트 정의 (라우터 등록 없이)
@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Auth Service (서브라우터)", 
        "version": "1.0.0", 
        "status": "running",
        "docs": "/docs",
        "mode": "sub-router"
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy", "service": "auth", "mode": "sub-router"}

@app.post("/register")
async def register_user(user_data: dict):
    """사용자 회원가입 - Gateway에서 프록시된 요청"""
    logger.info(f"🔵 /register 엔드포인트 호출됨 (서브라우터)")
    logger.info(f"🔵 받은 데이터: {user_data}")
    
    try:
        # 간단한 응답 (실제로는 데이터베이스 처리)
        logger.info(f"✅ 회원가입 성공: {user_data.get('email', 'unknown')}")
        return {
            "message": "회원가입 성공",
            "user": {
                "username": user_data.get('username'),
                "email": user_data.get('email'),
                "full_name": user_data.get('full_name'),
                "id": "temp_id_123"  # 임시 ID
            },
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"❌ 회원가입 실패: {str(e)}")
        return {"error": f"회원가입 실패: {str(e)}", "status": "error"}

@app.post("/login")
async def login_user(user_credentials: dict):
    """사용자 로그인 - Gateway에서 프록시된 요청"""
    logger.info(f"🔵 /login 엔드포인트 호출됨 (서브라우터)")
    logger.info(f"🔵 받은 데이터: {user_credentials}")
    
    try:
        # 간단한 응답 (실제로는 인증 처리)
        logger.info(f"✅ 로그인 성공: {user_credentials.get('email', 'unknown')}")
        return {
            "message": "로그인 성공",
            "user": {
                "email": user_credentials.get('email'),
                "token": "temp_token_123"  # 임시 토큰
            },
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"❌ 로그인 실패: {str(e)}")
        return {"error": f"로그인 실패: {str(e)}", "status": "error"}

# Docker 환경에서 포트 설정 (8000으로 고정)
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
