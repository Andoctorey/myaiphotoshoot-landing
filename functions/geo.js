export async function onRequest(context) {
  const { request } = context;
  const country = (request && request.cf && request.cf.country) ? request.cf.country : '';
  return new Response(JSON.stringify({ country }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
    status: 200,
  });
}


