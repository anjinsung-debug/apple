/**
 * 다음(카카오) 우편번호 서비스 팝업.
 * index.html 에서 스크립트를 이미 로드해 둠.
 */
export function openPostcode() {
  return new Promise((resolve, reject) => {
    if (!window.daum?.Postcode) {
      reject(new Error('우편번호 서비스를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.'));
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        resolve({
          zonecode: data.zonecode,
          roadAddress: data.roadAddress || data.address,
          jibunAddress: data.jibunAddress || null,
          buildingName: data.buildingName || '',
        });
      },
      onclose: (state) => {
        if (state === 'FORCE_CLOSE') reject(new Error('주소 검색이 취소되었습니다.'));
      },
    }).open();
  });
}
