// 'map' div에 지도를 초기화합니다.
        // 예제로 서울 시청을 중심으로 설정
        var map = L.map('map').setView([37.5665, 126.9780], 13);

        // OpenStreetMap 타일 레이어를 추가합니다. (무료 지도 타일)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);