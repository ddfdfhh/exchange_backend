export declare enum Status {
    ACTIVE = "Active",
    INACTIVE = "In-Active",
    BLACKLISTED = "Blacklisted"
}
export declare enum YesNo {
    YES = "Yes",
    NO = "No"
}
export declare class User {
    id: number;
    email: string;
    name: string;
    uuid: string;
    referral_id: string;
    password: string;
    zasper_id: string;
    phone_number: string;
    refreshToken: string;
    twofa_secret: string;
    status: Status;
    email_verified: YesNo;
    is_two_fa_enabled: YesNo;
    id_verified: YesNo;
    spot_wallet: number;
    fund_wallet: number;
    ip_address: string;
    logged_in_at: Date;
    created_at: Date;
}
