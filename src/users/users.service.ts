import { Injectable } from '@nestjs/common';

export type User = any;

@Injectable()
export class UsersService {
    private readonly users = [
        {
            userId: 1,
            email: 'admin@daum.net',
            password: 'admin123', // Note: In a real app, use hashed passwords
        },
        {
            userId: 2,
            email: 'user@example.com',
            password: 'password',
        },
    ];

    async findOne(email: string): Promise<User | undefined> {
        return this.users.find((user) => user.email === email);
    }

    async findAll(): Promise<User[]> {
        return this.users.map(({ password, ...result }) => result);
    }

    async create(user: any): Promise<User> {
        const newUser = {
            ...user,
            userId: this.users.length + 1,
        };
        this.users.push(newUser);
        return newUser;
    }
}
