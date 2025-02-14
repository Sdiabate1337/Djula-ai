export class DatabaseError extends Error {
    code: string;
  
    constructor(message: string, code: string) {
      super(message);
      this.name = 'DatabaseError';
      this.code = code;
    }
  }