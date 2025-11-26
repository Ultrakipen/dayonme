// types/validation.ts 파일 생성
export interface ValidationRule {
    run: (req: any) => Promise<any>;
    field?: string;
    type?: string;
  }