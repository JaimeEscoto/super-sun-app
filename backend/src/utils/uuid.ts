const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getValidUuid = (value?: string | null) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  return UUID_REGEX.test(value) ? value : undefined;
};
