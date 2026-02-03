import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // 인증 시도 (실패해도 요청 진행)
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // 인증 실패해도 에러 throw 하지 않고 null 반환
    // 로그인하지 않은 사용자도 접근 가능하게 함
    return user || null;
  }
}
