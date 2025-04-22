import dotenv from 'dotenv';
dotenv.config();
interface DBConfig {
    uri: string;
    databases: string[];
}
export interface CollectionMaskConfig {
    [collectionName: string]: string[];
}
export interface DataMaskConfigByDatabase {
    [databaseName: string]: CollectionMaskConfig;
}

export const dataMaskConfig: DataMaskConfigByDatabase = {
    account: {
        affiliatetransactions: ['user.name', 'user.email', 'user.phoneNumber', 'user.address', 'bank.name', 'bank.accountNumber', 'bank.accountOwner', 'ip'],
        banned_accounts: ['value'],
        bonus: ['user.email', 'user.name'],
        users: ['firstName', 'lastName', 'email', 'avatar', 'username', 'providerUserId', 'emailWithoutDot'],
        v3users: ['firstName', 'lastName', 'email', 'phoneNumber', 'avatar']
    },
    cms: {
        subscribers: ['email'],
        support_tickets: ['email', 'phoneNumber'],
    },
    ctl: {
        users: ['phoneNumber'],
    },
    notification: {
        tokens: ['token'],
        znstokens: ['accessToken', 'refreshToken']
    },
    notifier: {
        slacks: ['token'],
    },
    payment: {
        orders: ['slack.customerName', 'slack.customerEmail', 'confirmedBy'],
        tickets: ['user.email', 'user.firstName', 'user.lastName', 'phoneNumber', 'email', 'fullName'],
    },
    tts: {
        apps: ['token', 'secretKey'],
        errorreports: ['user.name', 'user.email', 'user.phoneNumber'],
        voiceclonings: ['code', 'name', 'gender', 'province'],
        warningrequests: ['user.email', 'user.name', 'user.phoneNumber', 'ip'],
    },
    tts_gateway: {
        apps: ['secretKey', 'token'],
    }
};

const databaseNames = Object.keys(dataMaskConfig);

export const config: DBConfig =
{
    uri: process.env.MONGO_URI!,
    databases: databaseNames
}
