import React, { useState, useCallback } from 'react';
import { 
  NativeSyntheticEvent, 
  TextInputChangeEventData 
} from 'react-native';

interface FormErrors {
  [key: string]: string;
}

export type Validator<T> = (values: T) => FormErrors;

interface UseFormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: Validator<T>;
}

type InputChangeEvent = NativeSyntheticEvent<TextInputChangeEventData>;

export const useForm = <T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormProps<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 텍스트 입력 처리
  const handleTextChange = useCallback((
    name: keyof T
  ) => (e: InputChangeEvent) => {
    const value = e.nativeEvent.text;
    handleChange(name, value);
  }, []);

  // 스위치/체크박스 처리
  const handleToggleChange = useCallback((
    name: keyof T
  ) => (value: boolean) => {
    handleChange(name, value);
  }, []);

  // 모든 필드 터치 설정
  const setAllTouched = useCallback(() => {
    const allTouched: Record<string, boolean> = {};
    (Object.keys(values) as Array<keyof T>).forEach(key => {
      allTouched[key as string] = true;
    });
    setTouched(allTouched);
  }, [values]);

  // 필드 변경 처리
  const handleChange = useCallback((
    name: keyof T, 
    value: string | boolean | number
  ) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    
    // 필드가 터치되었음을 표시
    setTouched(prev => ({
      ...prev,
      [name as string]: true
    }));
    
    // 필드 값이 변경되면 해당 필드의 에러 초기화
    if (errors[name as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
        return newErrors;
      });
    }
  }, [errors]);

  // 값 직접 설정(객체 통째로 업데이트용)
  const setFieldValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // 단일 필드 값 설정
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  }, []);

  // 필드 터치 설정
  const setFieldTouched = useCallback((name: string, isTouched: boolean = true) => {
    setTouched(prev => ({
      ...prev,
      [name]: isTouched
    }));
  }, []);

  // 폼 유효성 검사
  const validateForm = useCallback(() => {
    if (!validate) return {};
    
    const validationErrors = validate(values);
    setErrors(validationErrors);
    return validationErrors;
  }, [validate, values]);

  // 폼 제출 처리
  const handleSubmit = useCallback(async () => {
    // 모든 필드를 터치 상태로 변경
    setAllTouched();
    
    // 유효성 검사 실행
    const validationErrors = validateForm();
    
    // 에러가 있으면 제출하지 않음
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, setAllTouched, validateForm, values]);

  // 폼 초기화
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // 특정 필드에 에러 설정
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // 특정 필드의 에러 가져오기
  const getFieldError = useCallback((name: string): string => {
    return errors[name] || '';
  }, [errors]);

  // 특정 필드가 터치되었는지 확인
  const isTouched = useCallback((name: string): boolean => {
    return !!touched[name];
  }, [touched]);

  // 모든 필드가 유효한지 확인
  const isValid = useCallback((): boolean => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleTextChange,
    handleToggleChange,
    handleSubmit,
    setFieldValue,
    setFieldValues,
    setFieldTouched,
    setAllTouched,
    resetForm,
    validateForm,
    setFieldError,
    getFieldError,
    isTouched,
    isValid,
  };
};

export default useForm;