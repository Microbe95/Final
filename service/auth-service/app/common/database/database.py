"""
데이터베이스 연결 설정
PostgreSQL 연결 및 세션 관리

주요 기능:
- PostgreSQL 연결 설정 (동기/비동기)
- 세션 관리 및 풀링
- 테이블 자동 생성
- Railway 환경 자동 감지
- 내부/퍼블릭 네트워크 우선순위 관리
"""

# ============================================================================
# 📦 필요한 모듈 import
# ============================================================================

import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.domain.model.db_models import Base
from app.common.config import DatabaseConfig

# ============================================================================
# 🔧 로거 설정
# ============================================================================

logger = logging.getLogger(__name__)

# ============================================================================
# 🗄️ 데이터베이스 연결 관리 클래스
# ============================================================================

class Database:
    """
    데이터베이스 연결 관리 클래스
    
    주요 기능:
    - PostgreSQL 연결 설정 (동기/비동기)
    - 세션 팩토리 생성
    - 테이블 자동 생성
    - Railway 환경 자동 감지
    """
    
    def __init__(self):
        """데이터베이스 초기화"""
        # 환경변수 우선순위에 따른 데이터베이스 URL 설정
        self.database_url = DatabaseConfig.get_database_url()
        self.engine = None
        self.async_engine = None
        self.SessionLocal = None
        self.AsyncSessionLocal = None
        
        if not self.database_url:
            logger.warning("⚠️ 데이터베이스 URL이 설정되지 않았습니다. 메모리 저장소를 사용합니다.")
            return
        
        # Railway 환경 및 네트워크 타입 로깅
        if DatabaseConfig.is_railway_environment():
            network_type = "내부" if DatabaseConfig.is_internal_network() else "퍼블릭"
            logger.info(f"🔧 Railway 환경 감지 - {network_type} 네트워크 사용")
            
        self._setup_database()
    
    def _setup_database(self):
        """
        데이터베이스 연결 설정
        
        주요 설정:
        - 동기 엔진: 테이블 생성 및 관리용
        - 비동기 엔진: 실제 애플리케이션 사용용
        - 세션 팩토리: 동기/비동기 세션 생성
        """
        try:
            # Railway PostgreSQL URL을 asyncpg 형식으로 변환
            if self.database_url.startswith("postgresql://"):
                async_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            else:
                async_url = self.database_url
            
            # 동기 엔진 (테이블 생성용)
            self.engine = create_engine(
                self.database_url,
                poolclass=NullPool,  # Railway에서 권장
                echo=False
            )
            
            # 비동기 엔진 (실제 사용)
            self.async_engine = create_async_engine(
                async_url,
                poolclass=NullPool,  # Railway에서 권장
                echo=False
            )
            
            # 세션 팩토리 생성
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            self.AsyncSessionLocal = async_sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.async_engine
            )
            
            logger.info("✅ 데이터베이스 연결 설정 완료")
            
        except Exception as e:
            logger.error(f"❌ 데이터베이스 연결 설정 실패: {str(e)}")
            self.database_url = None
    
    def create_tables(self):
        """테이블 생성 (기존 테이블 강제 삭제 후 새로 생성)"""
        if not self.engine:
            logger.warning("⚠️ 데이터베이스 연결이 설정되지 않았습니다.")
            return False
            
        try:
            with self.engine.connect() as conn:
                # 트랜잭션 시작
                trans = conn.begin()
                try:
                    # 1. 기존 테이블이 있는지 확인
                    result = conn.execute(text("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = 'public' 
                            AND table_name = 'users'
                        );
                    """))
                    table_exists = result.scalar()
                    
                    if table_exists:
                        logger.info("🗑️ 기존 users 테이블 발견 - 삭제 시작")
                        
                        # 2. 기존 테이블 삭제 (여러 방법 시도)
                        try:
                            # 방법 1: CASCADE로 삭제
                            conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
                            logger.info("✅ CASCADE로 테이블 삭제 완료")
                        except Exception as e:
                            logger.warning(f"⚠️ CASCADE 삭제 실패: {str(e)}")
                            try:
                                # 방법 2: 강제 삭제
                                conn.execute(text("DROP TABLE users"))
                                logger.info("✅ 강제 테이블 삭제 완료")
                            except Exception as e2:
                                logger.warning(f"⚠️ 강제 삭제 실패: {str(e2)}")
                                # 방법 3: 컬럼별로 삭제
                                try:
                                    conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS username"))
                                    logger.info("✅ username 컬럼 삭제 완료")
                                except Exception as e3:
                                    logger.warning(f"⚠️ 컬럼 삭제 실패: {str(e3)}")
                
                    # 3. 새 스키마로 테이블 생성
                    logger.info("🔨 새로운 스키마로 users 테이블 생성 시작")
                    Base.metadata.create_all(bind=self.engine)
                    logger.info("✅ 새로운 스키마로 users 테이블 생성 완료")
                    
                    # 트랜잭션 커밋
                    trans.commit()
                    return True
                    
                except Exception as e:
                    # 트랜잭션 롤백
                    trans.rollback()
                    logger.error(f"❌ 테이블 생성 실패: {str(e)}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ 데이터베이스 연결 실패: {str(e)}")
            return False
    
    def get_session(self):
        """동기 세션 반환"""
        if not self.SessionLocal:
            return None
        return self.SessionLocal()
    
    async def get_async_session(self) -> AsyncSession:
        """비동기 세션 반환"""
        if not self.AsyncSessionLocal:
            return None
        return self.AsyncSessionLocal()
    
    def close(self):
        """데이터베이스 연결 종료"""
        if self.engine:
            self.engine.dispose()
        if self.async_engine:
            self.async_engine.dispose()
        logger.info("🔌 데이터베이스 연결 종료")

# 전역 데이터베이스 인스턴스
database = Database()
