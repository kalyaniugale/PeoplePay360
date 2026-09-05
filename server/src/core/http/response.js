export const sendData = (res, data, statusCode = 200) => res.status(statusCode).json({ data });

export const sendList = (res, data, meta) => res.status(200).json({ data, meta });
