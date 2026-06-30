let _io: any = null;

export const setIo = (io: any) => { _io = io; };
export const getIo = () => _io;
