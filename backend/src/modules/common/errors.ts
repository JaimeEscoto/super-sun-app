export class ApplicationError extends Error {
  public readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message = 'Prohibido') {
    super(message, 403);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = 'No encontrado') {
    super(message, 404);
  }
}
