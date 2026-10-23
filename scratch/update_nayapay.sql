UPDATE payment_methods 
SET id = 'pm-nayapay', 
    name = 'NayaPay Wallet', 
    account_number = '03246533046', 
    account_title = 'Muhammad Ijaz', 
    instructions = 'Transfer funds via NayaPay to 03246533046 (Muhammad Ijaz). Upload transaction screenshot below for immediate verification.', 
    badge = 'INSTANT' 
WHERE id = 'pm-meezan' OR name LIKE '%Meezan%' OR name LIKE '%Bank%';

SELECT id, name, type, account_number, account_title, badge, status FROM payment_methods;
