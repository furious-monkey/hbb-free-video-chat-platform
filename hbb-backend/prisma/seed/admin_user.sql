-- Insert an admin user
INSERT INTO
    hbb_db."User" (
        id,
        "userRole",
        email,
        password,
        "firstName",
        "lastName",
        age,
        gender,
        "referralCode",
        "ownedReferralCode",
        "dateOfBirth",
        phone,
        "profileImage",
        "promotionalVideo",
        "isOnline",
        "isBanned",
        "isEmailVerified",
        "isDeleted",
        "createdAt",
        "updatedAt",
        "blockedUsers",
        otp,
        "otpExpires"
    )
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'ADMIN',
        'admin@hunnybunnybun.com',
        'hashed_password_here',
        'Admin',
        'User',
        NULL,
        NULL,
        NULL,
        'lTlSAB',
        NULL,
        NULL,
        NULL,
        '{}',
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        NOW(),
        NOW(),
        '{}',
        NULL,
        NULL
    );


-- Insert the corresponding admin profile
INSERT INTO hbb_db."Profile" (
    id,
    "userId",
    username,
    bio,
    location,
    interests,
    "zodiacSign",
    "callRate",
    "likedProfiles",
    "subscriptionPlan",
    "subscriptionStatus",
    "allowLike"
) VALUES (
    '00000000-0000-0000-0000-000000000002', -- UUID for the profile id
    '00000000-0000-0000-0000-000000000001', -- userId must match the user's id
    'admin001',
    'This is the admin profile.',
    'USA',
    '{}', -- interests as an empty array
    NULL,
    NULL,
    '{}', -- likedProfiles as an empty array
    'PREMIUM',
    'ACTIVE',
    NULL
);