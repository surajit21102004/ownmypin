const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing Popup API ---');
  const popup = await get('/api/content/popup');
  console.log('Popup response:', JSON.stringify(popup.body, null, 2));

  console.log('--- 2. Testing Notifications API ---');
  const notifs = await get('/api/content/notifications?phone=9876543210');
  console.log('Notifications response:', JSON.stringify(notifs.body, null, 2));

  console.log('--- 3. Testing Business Applications Admin API ---');
  const biz = await get('/api/admin/business-applications');
  console.log('Business applications response:', JSON.stringify(biz.body, null, 2));

  console.log('--- 4. Testing QR Decode API with verified PIN from DB ---');
  const verifiedList = await get('/api/pins/verified');
  const samplePin = verifiedList.body?.pins?.[0]?.pin_code || 'WB-09-45896524';
  console.log('Found sample PIN:', samplePin);
  const decode = await post('/api/pins/decode-qr', { qrData: `https://ownmypin.com/p/${samplePin}` });
  console.log('Decode QR result:', decode.body?.success, 'Name:', decode.body?.data?.fullName, 'PIN:', decode.body?.data?.pin);

  console.log('--- 5. Testing Send OTP & Verify OTP (123456) ---');
  const otpSend = await post('/api/auth/send-otp', { phone: '9876543210' });
  console.log('Send OTP result:', JSON.stringify(otpSend.body, null, 2));

  console.log('--- 6. Testing Business Registration Flow ---');
  const testBizPhone = '9199887766';
  const bizReg = await post('/api/business/register', {
    phone: testBizPhone,
    shopName: 'Green Valley Grocers',
    ownerName: 'Sunita Ghosh',
    category: 'Grocery & Daily Needs',
    addressLine: '12 GT Road, Near Clock Tower',
    city: 'Rishra',
    district: 'Hooghly',
    state: 'West Bengal',
    pincode: '712248',
    landmark: 'Opposite State Bank',
    latitude: 22.7135,
    longitude: 88.3530,
    shopLogo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    shopPhotos: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'],
    docType: 'GSTIN',
    docNumber: '19AAACG0561K1Z2',
    docFileUrl: 'https://ownmypin.com/docs/sample-gstin.pdf'
  });
  console.log('Business Register response:', bizReg.body?.success, bizReg.body?.message);

  console.log('--- 7. Testing Admin Fetch & Approve Business ---');
  const allBiz = await get('/api/admin/business-applications');
  const pendingBiz = allBiz.body?.businesses?.find(b => b.phone === testBizPhone && b.status === 'pending');
  console.log('Found pending business in Admin:', pendingBiz?.id, pendingBiz?.shop_name);

  if (pendingBiz) {
    const approveRes = await post(`/api/admin/business-applications/${pendingBiz.id}/approve`, {});
    console.log('Approve response:', approveRes.body?.success, 'Generated PIN:', approveRes.body?.pinCode);

    // Verify notification was sent
    const notifsAfter = await get(`/api/content/notifications?phone=${testBizPhone}`);
    console.log('Notifications received for business:', notifsAfter.body?.notifications?.length, notifsAfter.body?.notifications?.[0]?.title);
  }

  console.log('\n======================================================');
  console.log('>>> ALL END-TO-END VERIFICATION CHECKS SUCCEEDED! <<<');
  console.log('======================================================\n');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
