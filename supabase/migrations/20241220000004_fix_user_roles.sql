-- Fix user roles - set teemu.kinnunen@rapidly.fi as admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'teemu.kinnunen@rapidly.fi'
);

-- Also set admin@totuusonrakkaus.fi as admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'admin@totuusonrakkaus.fi'
);
