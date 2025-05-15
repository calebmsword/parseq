declare class XMLHttpRequest {
  // -- properties

  static DONE: number;

  readyState: number;

  status: number | null;

  responseText: string;

  // -- methods

  onreadystatechange: () => void | null;

  getAllResponseHeaders: () => string;

  onerror: () => void | null;

  open: (
    method: string,
    url: string,
    async: boolean,
    user?: string,
    password?: string,
  ) => void;

  setRequestHeader: (name: string, value: string) => void;

  send: (data?: string) => void;

  abort: (reason?: unknown) => void;
}
