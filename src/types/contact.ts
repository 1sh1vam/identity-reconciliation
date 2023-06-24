export interface IContactRecord {
    id: number;
    linkedId?: number;
    phoneNumber?: number;
    email?: string;
    linkPrecedence: 'primary' | 'secondary';
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}