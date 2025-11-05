-- Insert profiles for users who don't have a profile yet
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
    "viewCount", 
    likes, 
    "allowLike"
)
SELECT 
    gen_random_uuid(), 
    u.id, 
    NULL,        -- username
    NULL,        -- bio
    NULL,        -- location
    '{}',        -- interests (empty array)
    NULL,        -- zodiacSign
    NULL,        -- callRate
    '{}',        -- likedProfiles (empty array)
    NULL,        -- subscriptionPlan
    NULL,        -- subscriptionStatus
    0,           -- viewCount
    0,           -- likes
    NULL         -- allowLike
FROM hbb_db."User" u
LEFT JOIN hbb_db."Profile" p ON p."userId" = u.id
WHERE p."userId" IS NULL;
