export function redactSecrets(message: string) {
  return message
    .replace(/mongodb(?:\+srv)?:\/\/\S+/gi, 'mongodb://[redacted]')
    .replace(/(password|jwt|secret)=([^&\s]+)/gi, '$1=[redacted]');
}
