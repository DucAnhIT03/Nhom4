import axios from '../apis/axios';

export interface SendMailDto {
  to: string;
  subject: string;
  body: string;
}

export interface SendBulkMailDto {
  userIds?: number[];
  emails?: string[];
  sendToAll?: string;
  subject: string;
  body: string;
}

export interface MailResponse {
  jobId?: string;
  totalEmails?: number;
  jobIds?: string[];
}

export const sendMail = async (data: SendMailDto): Promise<MailResponse> => {
  const response = await axios.post<MailResponse>('/mail/queue', data);
  return response.data;
};

export const sendBulkMail = async (data: SendBulkMailDto): Promise<MailResponse> => {
  const response = await axios.post<MailResponse>('/mail/bulk', data);
  return response.data;
};

