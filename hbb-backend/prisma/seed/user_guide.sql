INSERT INTO hbb_db."UserGuide" (
    id,
    issue,
    fix,
    published,
    "createdAt",
    "updatedAt"
) VALUES 
    ('30000000-0000-0000-0000-000000000001', 'Application crashes on startup', 'Make sure you have the latest version installed. If the issue persists, try reinstalling the application.',true, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000002', 'Cannot connect to the server', 'Check your internet connection and try again. If the problem continues, contact support.',true, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000003', 'Unable to login', 'Ensure that you are using the correct username and password. If you have forgotten your password, use the "Forgot Password" option to reset it.',true, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000004', 'Profile information not updating', 'Make sure all required fields are filled out correctly and try saving again. If the issue persists, clear your browser cache and try again.',true, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000005', 'Error 404: Page not found', 'Check the URL you have entered and try again. If you believe this is an error, please contact support.',true, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000006', 'Application running slow', 'Close any unnecessary applications running on your device. Ensure your device meets the minimum system requirements.',true, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000007', 'Payment not processing', 'Verify your payment details and try again. If the issue persists, contact your bank or payment provider.',true, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000008', 'Cannot upload files', 'Ensure that the files meet the required format and size. Check your internet connection and try again.',true, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000009', 'Notifications not working', 'Check your notification settings in the application and your device. Make sure notifications are enabled.',true, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000010', 'App not syncing data', 'Ensure you are connected to the internet. Try manually syncing the data from the settings menu.',true, NOW(), NOW());
