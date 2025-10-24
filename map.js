// 전역 map 변수 선언
let map;
// 등록된 핀들을 저장하는 배열
let savedPins = [];
// 현재 선택된 핀의 위치를 저장
let selectedPinLocation = null;
// 현재 확대된 핀
let currentExpandedPin = null;

// DOM이 로드된 후 지도를 초기화합니다.
document.addEventListener('DOMContentLoaded', function() {
    // 'map' div에 지도를 초기화합니다.
    // 예제로 서울 시청을 중심으로 설정
    map = L.map('map').setView([37.5665, 126.9780], 13);

    // OpenStreetMap 타일 레이어를 추가합니다. (무료 지도 타일)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 시간 기반 그라디언트 적용
    applyTimeBasedGradient();
    
    // 위치 정보 업데이트
    updateLocationInfo();
    
    // 지도 이동 시 위치 정보 업데이트 (디바운싱 적용)
    let locationUpdateTimeout;
    map.on('moveend', function() {
        console.log('지도 이동 완료, 위치 정보 업데이트');
        clearTimeout(locationUpdateTimeout);
        locationUpdateTimeout = setTimeout(() => {
            updateLocationInfo();
        }, 300); // 300ms 후 업데이트
    });
    
    console.log('지도 초기화 완료');
    
    // 플래그 버튼 클릭 이벤트
    const flagButton = document.getElementById('flag-button');
    let isPinMode = false;
    let currentPin = null;
    
    flagButton.addEventListener('click', function() {
        if (!isPinMode) {
            // 핀 모드 활성화
            isPinMode = true;
            addPinToMap();
            updateUIForPinMode();
        } else {
            // 위치 선택 완료
            completeLocationSelection();
        }
    });
    
    // 지도 클릭 시 핀 이동
    map.on('click', function(e) {
        if (isPinMode) {
            movePin(e.latlng);
        }
    });
    
    // 핀 추가 함수
    function addPinToMap() {
        const center = map.getCenter();
        currentPin = L.marker([center.lat, center.lng], {
            icon: L.divIcon({
                className: 'custom-pin',
                html: '<div class="pin-marker">📍</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(map);
    }
    
    // 핀 이동 함수
    function movePin(latlng) {
        if (currentPin) {
            currentPin.setLatLng(latlng);
        }
    }
    
    // 핀 모드 UI 업데이트
    function updateUIForPinMode() {
        // 버튼 클래스 및 텍스트 변경
        flagButton.classList.add('completed');
        flagButton.innerHTML = `
            <span style="color: #B3AFE8; font-size: 14px; font-weight: 600; white-space: nowrap;">위치 선택 완료</span>
        `;
        
        // 상단 텍스트 변경
        document.getElementById('district-info').textContent = '새로운 감정';
        document.getElementById('country-info').style.display = 'none';
    }
    
    // 위치 선택 완료 함수
    function completeLocationSelection() {
        if (currentPin) {
            const pinLatLng = currentPin.getLatLng();
            console.log('선택된 위치:', pinLatLng);
            
            // 선택된 위치 저장
            selectedPinLocation = pinLatLng;
            
            // 핀 제거
            map.removeLayer(currentPin);
            currentPin = null;
            
            // 감정 추가 페이지 표시
            showEmotionPage(pinLatLng);
        }
    }
    
    // 감정 추가 페이지 표시
    function showEmotionPage(latLng) {
        const emotionPage = document.getElementById('emotion-page');
        const detailedLocation = document.getElementById('detailed-location');
        
        // 로딩 표시
        detailedLocation.textContent = '주소 조회 중...';
        
        // 페이지 표시
        emotionPage.classList.remove('hidden');
        setTimeout(() => {
            emotionPage.classList.add('show');
        }, 10);
        
        // 역지오코딩으로 주소 가져오기
        getAddressFromCoordinates(latLng.lat, latLng.lng)
            .then(address => {
                detailedLocation.textContent = address;
            })
            .catch(error => {
                console.error('주소 조회 실패:', error);
                detailedLocation.textContent = `좌표: ${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`;
            });
    }
    
    // 감정 추가 페이지 숨기기
    function hideEmotionPage() {
        const emotionPage = document.getElementById('emotion-page');
        emotionPage.classList.remove('show');
        setTimeout(() => {
            emotionPage.classList.add('hidden');
        }, 300);
    }
    
    // 뒤로가기 버튼 이벤트
    document.getElementById('back-button').addEventListener('click', function() {
        // 입력 필드 초기화
        document.getElementById('place-nickname').value = '';
        document.getElementById('place-story').value = '';
        
        // 선택된 옵션 초기화
        document.querySelectorAll('.option-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 선택된 위치 초기화
        selectedPinLocation = null;
        
        // 이미지 초기화
        selectedImageData = null;
        const preview = document.getElementById('image-preview');
        preview.classList.add('hidden');
        preview.innerHTML = '';
        document.getElementById('place-image').value = '';
        
        hideEmotionPage();
        
        // UI 원래대로 복원
        isPinMode = false;
        flagButton.classList.remove('completed');
        flagButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="flagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#B3AFE8;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#9FCEDB;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <path d="M12 2L13.09 8.26L19 7L13.09 15.74L12 22L10.91 15.74L5 17L10.91 8.26L12 2Z" fill="url(#flagGradient)"/>
            </svg>
        `;
        
        // 상단 텍스트 복원
        document.getElementById('country-info').style.display = 'block';
        updateLocationInfo();
    });
    
    // 이미지 업로드 처리
    let selectedImageData = null;
    
    document.getElementById('image-upload-trigger').addEventListener('click', function() {
        document.getElementById('place-image').click();
    });
    
    document.getElementById('place-image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB 제한
                alert('이미지 크기는 5MB 이하여야 합니다.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                selectedImageData = event.target.result;
                
                // 미리보기 표시
                const preview = document.getElementById('image-preview');
                preview.innerHTML = `
                    <img src="${selectedImageData}" alt="미리보기">
                    <button class="image-preview-remove" id="remove-image">×</button>
                `;
                preview.classList.remove('hidden');
                
                // 제거 버튼 이벤트
                document.getElementById('remove-image').addEventListener('click', function() {
                    selectedImageData = null;
                    preview.classList.add('hidden');
                    preview.innerHTML = '';
                    document.getElementById('place-image').value = '';
                });
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 등록하기 버튼 이벤트
    document.getElementById('register-button').addEventListener('click', function() {
        console.log('등록하기 버튼 클릭됨');
        
        const nickname = document.getElementById('place-nickname').value.trim();
        const story = document.getElementById('place-story').value.trim();
        
        // 입력 검증
        // 1. 별명 검증
        if (!nickname) {
            alert('별명을 입력해주세요.');
            document.getElementById('place-nickname').focus();
            return;
        }
        if (nickname.length < 2) {
            alert('별명은 최소 2자 이상 입력해주세요.');
            document.getElementById('place-nickname').focus();
            return;
        }
        if (nickname.length > 20) {
            alert('별명은 최대 20자까지 입력 가능합니다.');
            document.getElementById('place-nickname').focus();
            return;
        }
        
        // 2. 이야기 검증
        if (!story) {
            alert('이야기를 작성해주세요.');
            document.getElementById('place-story').focus();
            return;
        }
        if (story.length < 10) {
            alert('이야기는 최소 10자 이상 작성해주세요.');
            document.getElementById('place-story').focus();
            return;
        }
        if (story.length > 500) {
            alert('이야기는 최대 500자까지 입력 가능합니다.');
            document.getElementById('place-story').focus();
            return;
        }
        
        // 모든 input-section 찾기
        const inputSections = document.querySelectorAll('.emotion-content .input-section');
        console.log('input-section 개수:', inputSections.length);
        
        // 장소 종류와 감정 섹션 찾기
        let selectedPlaceType = null;
        let selectedEmotion = null;
        
        inputSections.forEach((section, index) => {
            const label = section.querySelector('.input-label');
            if (label) {
                const labelText = label.textContent;
                console.log(`섹션 ${index}: ${labelText}`);
                
                if (labelText.includes('장소 종류')) {
                    selectedPlaceType = section.querySelector('.option-item.selected');
                    console.log('장소 종류 선택됨:', selectedPlaceType?.dataset.type);
                }
                if (labelText.includes('지금 느끼는 감정')) {
                    selectedEmotion = section.querySelector('.option-item.selected');
                    console.log('감정 선택됨:', selectedEmotion?.dataset.emotion);
                }
            }
        });
        
        // 3. 위치 검증
        if (!selectedPinLocation) {
            console.error('등록할 위치가 없습니다.');
            alert('핀 위치를 선택해주세요.');
            return;
        }
        
        // 4. 장소 종류 검증
        if (!selectedPlaceType) {
            alert('장소 종류를 선택해주세요.');
            return;
        }
        
        // 5. 감정 검증
        if (!selectedEmotion) {
            alert('지금 느끼는 감정을 선택해주세요.');
            return;
        }
        
        const pinLatLng = selectedPinLocation;
        console.log('핀 위치:', pinLatLng);
        
        // 선택된 감정 이모지 가져오기
        const emotionIcon = selectedEmotion ? selectedEmotion.querySelector('.option-icon').textContent : '📍';
        
        // 감정에 따른 색상 매핑
        const emotionColors = {
            'happy': '#4CAF50',      // 초록색
            'disgusted': '#9C27B0',  // 보라색
            'angry': '#F44336',      // 빨간색
            'surprised': '#FF9800',  // 주황색
            'sad': '#2196F3'         // 파란색
        };
        
        const emotionType = selectedEmotion?.dataset.emotion || 'happy';
        const pinColor = emotionColors[emotionType] || '#4285F4';
        
        console.log('등록 정보:', {
            nickname,
            placeType: selectedPlaceType?.dataset.type,
            emotion: emotionType,
            emotionIcon,
            pinColor,
            story,
            image: selectedImageData ? '이미지 있음' : '이미지 없음',
            location: pinLatLng
        });
        
        // 등록된 핀 추가
        addSavedPin(pinLatLng, emotionIcon, pinColor, {
            nickname,
            placeType: selectedPlaceType?.dataset.type,
            emotion: emotionType,
            story,
            image: selectedImageData
        });
        
        // 입력 필드 초기화
        document.getElementById('place-nickname').value = '';
        document.getElementById('place-story').value = '';
        
        // 선택된 옵션 초기화
        document.querySelectorAll('.option-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 이미지 초기화
        selectedImageData = null;
        const preview = document.getElementById('image-preview');
        preview.classList.add('hidden');
        preview.innerHTML = '';
        document.getElementById('place-image').value = '';
        
        // 선택된 위치 초기화
        selectedPinLocation = null;
        
        // 등록 완료 후 페이지 닫기
        hideEmotionPage();
        
        // UI 원래대로 복원
        isPinMode = false;
        flagButton.classList.remove('completed');
        flagButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="flagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#B3AFE8;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#9FCEDB;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <path d="M12 2L13.09 8.26L19 7L13.09 15.74L12 22L10.91 15.74L5 17L10.91 8.26L12 2Z" fill="url(#flagGradient)"/>
            </svg>
        `;
        
        // 상단 텍스트 복원
        document.getElementById('country-info').style.display = 'block';
        updateLocationInfo();
    });
    
    // 마우스 드래그 스크롤 기능 추가 (세로 스크롤)
    const emotionContent = document.querySelector('.emotion-content');
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    
    emotionContent.addEventListener('mousedown', function(e) {
        // 입력 요소나 버튼은 드래그에서 제외
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA' || 
            e.target.tagName === 'BUTTON' ||
            e.target.closest('button') ||
            e.target.classList.contains('option-item')) {
            return;
        }
        
        isDragging = true;
        startY = e.pageY - emotionContent.offsetTop;
        startScrollTop = emotionContent.scrollTop;
        emotionContent.style.cursor = 'grabbing';
        emotionContent.style.userSelect = 'none';
        e.preventDefault();
    });
    
    emotionContent.addEventListener('mouseleave', function() {
        isDragging = false;
        emotionContent.style.cursor = 'default';
    });
    
    emotionContent.addEventListener('mouseup', function() {
        isDragging = false;
        emotionContent.style.cursor = 'default';
        emotionContent.style.userSelect = 'auto';
    });
    
    emotionContent.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const y = e.pageY - emotionContent.offsetTop;
        const walk = (y - startY) * 1.5; // 스크롤 속도 조절
        emotionContent.scrollTop = startScrollTop - walk;
    });
    
    // 가로 스크롤 드래그 기능 추가 (옵션 그리드)
    const optionGrids = document.querySelectorAll('.option-grid');
    
    optionGrids.forEach(function(grid) {
        let isGridDragging = false;
        let startX = 0;
        let scrollLeft = 0;
        let hasMoved = false;
        let clickedItem = null;
        
        grid.addEventListener('mousedown', function(e) {
            isGridDragging = true;
            hasMoved = false;
            startX = e.pageX - grid.offsetLeft;
            scrollLeft = grid.scrollLeft;
            clickedItem = e.target.closest('.option-item');
            grid.style.cursor = 'grabbing';
            grid.style.userSelect = 'none';
            e.preventDefault();
        });
        
        grid.addEventListener('mouseleave', function() {
            isGridDragging = false;
            grid.style.cursor = 'grab';
        });
        
        grid.addEventListener('mouseup', function(e) {
            isGridDragging = false;
            grid.style.cursor = 'grab';
            grid.style.userSelect = 'auto';
            
            // 드래그하지 않고 클릭만 한 경우에만 옵션 선택
            if (!hasMoved && clickedItem) {
                // 같은 그리드의 다른 옵션들 선택 해제
                grid.querySelectorAll('.option-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // 클릭한 옵션 선택
                clickedItem.classList.add('selected');
            }
            
            clickedItem = null;
        });
        
        grid.addEventListener('mousemove', function(e) {
            if (!isGridDragging) return;
            
            const x = e.pageX - grid.offsetLeft;
            const walk = (x - startX) * 2; // 스크롤 속도 조절
            
            // 5px 이상 움직이면 드래그로 간주
            if (Math.abs(walk) > 5) {
                hasMoved = true;
            }
            
            if (hasMoved) {
                e.preventDefault();
                grid.scrollLeft = scrollLeft - walk;
            }
        });
    });
    
    // 지도 클릭 시 모든 핀 축소
    map.on('click', function() {
        if (currentExpandedPin) {
            currentExpandedPin.marker.setIcon(currentExpandedPin.pinIcon);
            currentExpandedPin.isExpanded = false;
            currentExpandedPin = null;
        }
    });
    
    // 바텀 시트 드래그 기능 (iOS 스타일)
    const bottomSheet = document.getElementById('place-detail-sheet');
    const sheetHandle = document.getElementById('sheet-handle-area');
    
    if (bottomSheet && sheetHandle) {
        const sheetOverlay = bottomSheet.querySelector('.sheet-overlay');
        const sheetContent = bottomSheet.querySelector('.sheet-content');
        let isDraggingSheet = false;
        let startY = 0;
        let startHeight = 0;
        let currentHeight = 40; // vh 단위
        const minHeight = 40; // 최소 높이 (vh)
        const maxHeight = 95; // 최대 높이 (vh)
        
        // 드래그 시작
        function startDrag(clientY, e) {
            // 태그나 스토리 부분은 드래그 불가 (스크롤만 가능)
            if (e.target.classList.contains('tags-container') ||
                e.target.closest('.tags-container') ||
                e.target.classList.contains('stories-container') ||
                e.target.closest('.stories-container')) {
                return false;
            }
            
            const scrollTop = sheetContent.scrollTop;
            
            // 최대 높이이고 스크롤이 맨 위가 아니면 스크롤만 가능
            if (currentHeight >= 94 && scrollTop > 5) {
                return false;
            }
            
            isDraggingSheet = true;
            startY = clientY;
            startHeight = currentHeight;
            sheetContent.style.transition = 'none';
            sheetContent.style.cursor = 'grabbing';
            
            return true;
        }
        
        sheetContent.addEventListener('mousedown', function(e) {
            startDrag(e.clientY, e);
        });
        
        sheetContent.addEventListener('touchstart', function(e) {
            startDrag(e.touches[0].clientY, e);
        }, { passive: true });
        
        // 드래그 중
        function onDrag(clientY) {
            if (!isDraggingSheet) return;
            
            const windowHeight = window.innerHeight;
            const deltaY = startY - clientY; // 위로 드래그하면 양수
            const deltaVh = (deltaY / windowHeight) * 100;
            
            // 새로운 높이 계산
            let newHeight = startHeight + deltaVh;
            newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
            
            currentHeight = newHeight;
            sheetContent.style.height = `${newHeight}vh`;
            
            // 94%에 도달하면 스크롤 가능하게
            if (newHeight >= 94) {
                sheetContent.style.overflowY = 'auto';
            } else {
                sheetContent.style.overflowY = 'hidden';
                sheetContent.scrollTop = 0; // 스크롤 위치 초기화
            }
        }
        
        document.addEventListener('mousemove', function(e) {
            if (!isDraggingSheet) return;
            e.preventDefault();
            onDrag(e.clientY);
        });
        
        document.addEventListener('touchmove', function(e) {
            if (!isDraggingSheet) return;
            onDrag(e.touches[0].clientY);
        }, { passive: true });
        
        // 드래그 종료
        function endDrag() {
            if (!isDraggingSheet) return;
            isDraggingSheet = false;
            
            sheetContent.style.transition = '';
            sheetContent.style.cursor = 'grab';
            
            // 스냅 포인트: 30% 이하면 닫기, 70% 이상이면 최대, 그 사이면 40%
            if (currentHeight < 30) {
                // 닫기
                hidePlaceDetailPage();
                if (currentExpandedPin) {
                    currentExpandedPin.marker.setIcon(currentExpandedPin.pinIcon);
                    currentExpandedPin.isExpanded = false;
                    currentExpandedPin = null;
                }
                currentHeight = minHeight;
                sheetContent.style.height = `${minHeight}vh`;
            } else if (currentHeight > 70) {
                // 최대로 확장
                currentHeight = maxHeight;
                sheetContent.style.height = `${maxHeight}vh`;
                sheetContent.style.overflowY = 'auto';
            } else {
                // 기본 크기로
                currentHeight = minHeight;
                sheetContent.style.height = `${minHeight}vh`;
                sheetContent.style.overflowY = 'hidden';
            }
        }
        
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        
        // 오버레이 클릭 시 닫기
        if (sheetOverlay) {
            sheetOverlay.addEventListener('click', function() {
                hidePlaceDetailPage();
                currentHeight = minHeight;
                sheetContent.style.height = `${minHeight}vh`;
                sheetContent.style.overflowY = 'hidden';
                if (currentExpandedPin) {
                    currentExpandedPin.marker.setIcon(currentExpandedPin.pinIcon);
                    currentExpandedPin.isExpanded = false;
                    currentExpandedPin = null;
                }
            });
        }
        
        // 더블 탭으로 빠른 확장/축소
        let lastTap = 0;
        sheetContent.addEventListener('click', function(e) {
            // 태그나 스토리 부분은 제외
            if (e.target.classList.contains('tags-container') ||
                e.target.closest('.tags-container') ||
                e.target.classList.contains('stories-container') ||
                e.target.closest('.stories-container') ||
                e.target.tagName === 'BUTTON' ||
                e.target.closest('button')) {
                return;
            }
            
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0) {
                // 더블 클릭
                if (currentHeight >= maxHeight - 5) {
                    // 축소
                    currentHeight = minHeight;
                    sheetContent.style.height = `${minHeight}vh`;
                    sheetContent.style.overflowY = 'hidden';
                } else {
                    // 확장
                    currentHeight = maxHeight;
                    sheetContent.style.height = `${maxHeight}vh`;
                    sheetContent.style.overflowY = 'auto';
                }
            }
            
            lastTap = currentTime;
        });
    }
    
    // 커스텀 옵션 추가 모달 기능
    const customModal = document.getElementById('custom-option-modal');
    const customModalTitle = document.getElementById('custom-modal-title');
    const customEmojiInput = document.getElementById('custom-emoji-input');
    const customNameInput = document.getElementById('custom-name-input');
    const customModalCancel = document.getElementById('custom-modal-cancel');
    const customModalConfirm = document.getElementById('custom-modal-confirm');
    
    const placeTypeMoreBtn = document.getElementById('place-type-more-btn');
    const emotionMoreBtn = document.getElementById('emotion-more-btn');
    const placeTypeGrid = document.getElementById('place-type-grid');
    const emotionGrid = document.getElementById('emotion-grid');
    
    let currentModalType = ''; // 'placeType' or 'emotion'
    
    // 이모지만 입력 가능하도록 검증하는 함수
    function isEmoji(str) {
        const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})+$/u;
        return emojiRegex.test(str);
    }
    
    // 이모지 입력 필드에 실시간 검증 추가
    customEmojiInput.addEventListener('input', function(e) {
        const value = e.target.value;
        if (value && !isEmoji(value)) {
            // 이모지가 아니면 마지막 입력 제거
            e.target.value = value.slice(0, -1);
            // 사용자에게 피드백
            e.target.style.borderColor = 'rgba(255, 100, 100, 0.5)';
            setTimeout(() => {
                e.target.style.borderColor = '';
            }, 500);
        }
    });
    
    // 장소 종류 더보기 버튼
    placeTypeMoreBtn.addEventListener('click', function() {
        currentModalType = 'placeType';
        customModalTitle.textContent = '새로운 장소 종류 추가';
        customEmojiInput.value = '';
        customNameInput.value = '';
        customModal.classList.remove('hidden');
        customEmojiInput.focus();
    });
    
    // 감정 더보기 버튼
    emotionMoreBtn.addEventListener('click', function() {
        currentModalType = 'emotion';
        customModalTitle.textContent = '새로운 감정 추가';
        customEmojiInput.value = '';
        customNameInput.value = '';
        customModal.classList.remove('hidden');
        customEmojiInput.focus();
    });
    
    // 모달 취소 버튼
    customModalCancel.addEventListener('click', function() {
        customModal.classList.add('hidden');
    });
    
    // 모달 오버레이 클릭 시 닫기
    const customModalOverlay = customModal.querySelector('.custom-modal-overlay');
    customModalOverlay.addEventListener('click', function() {
        customModal.classList.add('hidden');
    });
    
    // 모달 확인 버튼
    customModalConfirm.addEventListener('click', function() {
        const emoji = customEmojiInput.value.trim();
        const name = customNameInput.value.trim();
        
        if (!emoji) {
            alert('이모지를 입력해주세요.');
            customEmojiInput.focus();
            return;
        }
        
        if (!isEmoji(emoji)) {
            alert('이모지만 입력 가능합니다.');
            customEmojiInput.focus();
            return;
        }
        
        if (!name) {
            alert('이름을 입력해주세요.');
            customNameInput.focus();
            return;
        }
        
        if (name.length < 2) {
            alert('이름은 최소 2자 이상 입력해주세요.');
            customNameInput.focus();
            return;
        }
        
        // 새로운 옵션 추가
        if (currentModalType === 'placeType') {
            addCustomPlaceType(emoji, name);
        } else if (currentModalType === 'emotion') {
            addCustomEmotion(emoji, name);
        }
        
        // 모달 닫기
        customModal.classList.add('hidden');
    });
    
    // 커스텀 장소 종류 추가
    function addCustomPlaceType(emoji, name) {
        const customId = 'custom-place-' + Date.now();
        const newOption = document.createElement('div');
        newOption.className = 'option-item';
        newOption.dataset.type = customId;
        newOption.innerHTML = `
            <div class="option-icon">${emoji}</div>
            <div class="option-text">${name}</div>
        `;
        
        placeTypeGrid.appendChild(newOption);
        
        // 클릭 이벤트 추가
        newOption.addEventListener('click', function() {
            // 같은 그리드 내의 다른 선택 제거
            placeTypeGrid.querySelectorAll('.option-item').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
        });
        
        console.log('새로운 장소 종류 추가:', emoji, name);
    }
    
    // 커스텀 감정 추가
    function addCustomEmotion(emoji, name) {
        const customId = 'custom-emotion-' + Date.now();
        const newOption = document.createElement('div');
        newOption.className = 'option-item';
        newOption.dataset.emotion = customId;
        newOption.innerHTML = `
            <div class="option-icon">${emoji}</div>
            <div class="option-text">${name}</div>
        `;
        
        emotionGrid.appendChild(newOption);
        
        // 클릭 이벤트 추가
        newOption.addEventListener('click', function() {
            // 같은 그리드 내의 다른 선택 제거
            emotionGrid.querySelectorAll('.option-item').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
        });
        
        console.log('새로운 감정 추가:', emoji, name);
    }
});

// 시간에 따른 그라디언트 색상 결정 함수
function getTimeBasedGradient() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // 현재 시간을 분 단위로 계산 (더 정확한 시간 처리)
    const currentTimeInMinutes = hour * 60 + minute;
    const eveningTime = 18 * 60; // 저녁 6시 (18:00)를 분으로 변환
    const morningTime = 6 * 60;   // 아침 6시 (06:00)를 분으로 변환
    
    // 저녁 6시(18:00) 이후부터 다음날 아침 6시 전까지: 3833E1(30%) -> 6AE133(0%)
    if (currentTimeInMinutes >= eveningTime || currentTimeInMinutes < morningTime) {
        return {
            startColor: '#3833E1',
            endColor: '#6AE133',
            startOpacity: 0.3,
            endOpacity: 0,
            timePeriod: 'evening'
        };
    }
    // 아침 6시(06:00)부터 저녁 5시 59분(17:59)까지: E1B333(30%) -> E1DB33(0%)
    else {
        return {
            startColor: '#E1B333',
            endColor: '#E1DB33',
            startOpacity: 0.3,
            endOpacity: 0,
            timePeriod: 'day'
        };
    }
}

// 그라디언트 적용 함수
function applyTimeBasedGradient() {
    const gradient = getTimeBasedGradient();
    const gradientTop = document.getElementById('gradient-top');
    const gradientBottom = document.getElementById('gradient-bottom');
    
    // 현재 시간 정보를 콘솔에 출력 (디버깅용)
    const now = new Date();
    console.log(`현재 시간: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
    console.log(`시간대: ${gradient.timePeriod}`);
    
    // 상단 그라디언트 (위에서 아래로)
    const topGradient = `linear-gradient(to bottom, 
        rgba(${hexToRgb(gradient.startColor)}, ${gradient.startOpacity}) 0%, 
        rgba(${hexToRgb(gradient.endColor)}, ${gradient.endOpacity}) 100%)`;
    
    // 하단 그라디언트 (위에서 아래로, 180도 회전으로 인해 실제로는 아래에서 위로)
    const bottomGradient = `linear-gradient(to bottom, 
        rgba(${hexToRgb(gradient.startColor)}, ${gradient.startOpacity}) 0%, 
        rgba(${hexToRgb(gradient.endColor)}, ${gradient.endOpacity}) 100%)`;
    
    if (gradientTop && gradientBottom) {
        gradientTop.style.background = topGradient;
        gradientBottom.style.background = bottomGradient;
    }
}

// HEX 색상을 RGB로 변환하는 함수
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '0, 0, 0';
}

// 위치 정보 업데이트 함수
function updateLocationInfo() {
    if (!map) {
        console.log('지도가 아직 초기화되지 않았습니다.');
        return;
    }
    
    const center = map.getCenter();
    console.log('현재 지도 중심:', center.lat, center.lng);
    
    // 한국 주요 지역 좌표 매핑
    const locationData = getKoreanLocation(center.lat, center.lng);
    updateLocationDisplay(locationData);
}

// 한국 지역 정보를 좌표 기반으로 반환하는 함수
function getKoreanLocation(lat, lng) {
    console.log(`위치 검색: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    
    // 서울 주요 구의 중심 좌표 (더 정확한 좌표)
    const seoulDistricts = [
        { name: '강남구', centerLat: 37.5172, centerLng: 127.0473, dong: '역삼동' },
        { name: '강북구', centerLat: 37.6398, centerLng: 127.0253, dong: '미아동' },
        { name: '강동구', centerLat: 37.5301, centerLng: 127.1238, dong: '천호동' },
        { name: '강서구', centerLat: 37.5509, centerLng: 126.8496, dong: '화곡동' },
        { name: '관악구', centerLat: 37.4749, centerLng: 126.9513, dong: '신림동' },
        { name: '광진구', centerLat: 37.5507, centerLng: 127.0858, dong: '구의동' },
        { name: '구로구', centerLat: 37.4954, centerLng: 126.8874, dong: '구로동' },
        { name: '금천구', centerLat: 37.4601, centerLng: 126.9003, dong: '시흥동' },
        { name: '노원구', centerLat: 37.6542, centerLng: 127.0568, dong: '상계동' },
        { name: '도봉구', centerLat: 37.6688, centerLng: 127.0471, dong: '쌍문동' },
        { name: '동대문구', centerLat: 37.5838, centerLng: 127.0507, dong: '용신동' },
        { name: '동작구', centerLat: 37.5124, centerLng: 126.9397, dong: '상도동' },
        { name: '마포구', centerLat: 37.5663, centerLng: 126.9019, dong: '공덕동' },
        { name: '서대문구', centerLat: 37.5791, centerLng: 126.9368, dong: '신촌동' },
        { name: '서초구', centerLat: 37.4837, centerLng: 127.0324, dong: '서초동' },
        { name: '성동구', centerLat: 37.5633, centerLng: 127.0368, dong: '왕십리동' },
        { name: '성북구', centerLat: 37.5894, centerLng: 127.0167, dong: '성북동' },
        { name: '송파구', centerLat: 37.5145, centerLng: 127.1058, dong: '잠실동' },
        { name: '양천구', centerLat: 37.5264, centerLng: 126.8642, dong: '목동' },
        { name: '영등포구', centerLat: 37.5264, centerLng: 126.8962, dong: '여의도동' },
        { name: '용산구', centerLat: 37.5384, centerLng: 126.9654, dong: '이태원동' },
        { name: '은평구', centerLat: 37.6028, centerLng: 126.9291, dong: '불광동' },
        { name: '종로구', centerLat: 37.5735, centerLng: 126.9788, dong: '청계동' },
        { name: '중구', centerLat: 37.5636, centerLng: 126.9970, dong: '명동' },
        { name: '중랑구', centerLat: 37.6066, centerLng: 127.0926, dong: '면목동' }
    ];
    
    // 가장 가까운 구 찾기
    let closestDistrict = null;
    let minDistance = Infinity;
    
    for (let district of seoulDistricts) {
        // 거리 계산 (간단한 유클리드 거리)
        const distance = Math.sqrt(
            Math.pow(lat - district.centerLat, 2) + Math.pow(lng - district.centerLng, 2)
        );
        
        console.log(`${district.name}: 거리 ${distance.toFixed(4)}`);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestDistrict = district;
        }
    }
    
    // 가장 가까운 구 선택 (반경 체크 완화)
    if (closestDistrict) {
        console.log(`✅ 매칭된 지역: ${closestDistrict.name} (거리: ${minDistance.toFixed(4)})`);
        return {
            district: closestDistrict.name,
            country: '대한민국'
        };
    }
    
    // 서울 외 한국 지역 처리
    if (lat >= 33 && lat <= 38.5 && lng >= 124 && lng <= 132) {
        console.log('📍 서울 외 한국 지역');
        return {
            district: '한국 지역',
            country: '대한민국'
        };
    }
    
    // 기본값
    console.log('⚠️ 기본값 사용');
    return {
        district: '강북구 미아동',
        country: '대한민국'
    };
}

// 기본 위치 정보 설정 함수
function setDefaultLocation() {
    document.getElementById('district-info').textContent = '강북구 미아동';
    document.getElementById('country-info').textContent = '대한민국';
}

// 주소 정보를 파싱하여 표시하는 함수
function updateLocationDisplay(locationData) {
    const districtInfo = document.getElementById('district-info');
    const countryInfo = document.getElementById('country-info');
    
    if (districtInfo && countryInfo) {
        districtInfo.textContent = locationData.district;
        countryInfo.textContent = locationData.country;
        
        console.log('위치 정보 업데이트:', locationData);
    }
}

// 기본 핀 아이콘 생성 함수 (52x52px) - 물방울 모양
function createCustomPinIcon(emoji, color) {
    // 기본 상태: 물방울 모양 + 색상 원과 이모지
    const pinHTML = `
        <div class="pin-container" style="position: relative; width: 52px; height: 52px; transition: all 0.3s ease;">
            <svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <!-- 흰색 바탕 (물방울 모양 - 위가 둥글고 아래가 뾰족) -->
                <path d="M26 48 C26 48, 8 32, 8 20 C8 10, 16 4, 26 4 C36 4, 44 10, 44 20 C44 32, 26 48, 26 48 Z" 
                      fill="white" stroke="none"/>
                <!-- 색상이 있는 원 -->
                <circle cx="26" cy="20" r="14" fill="${color}"/>
            </svg>
            <!-- 이모지 -->
            <div style="position: absolute; top: 6px; left: 10px; width: 32px; height: 32px; 
                        display: flex; align-items: center; justify-content: center; 
                        font-size: 18px; pointer-events: none;">
                ${emoji}
            </div>
        </div>
    `;
    
    return L.divIcon({
        className: 'custom-saved-pin',
        html: pinHTML,
        iconSize: [52, 52],
        iconAnchor: [26, 48],
        popupAnchor: [0, -48]
    });
}

// 확대된 핀 아이콘 생성 함수 (80x80px) - 이미지 표시
function createExpandedPinIcon(emoji, color, imageData) {
    let pinHTML;
    
    if (imageData) {
        // 이미지가 있는 경우 - 말풍선 모양
        pinHTML = `
            <div class="pin-container expanded" style="position: relative; width: 80px; height: 88px;">
                <svg width="80" height="88" viewBox="0 0 80 88" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 10px rgba(0,0,0,0.3));">
                    <!-- 흰색 바탕 (둥근 사각형 + 하단 꼬리) -->
                    <path d="M 15 12 
                             L 65 12 
                             Q 74 12, 74 21
                             L 74 59
                             Q 74 68, 65 68
                             L 45 68
                             L 40 82
                             L 35 68
                             L 15 68
                             Q 6 68, 6 59
                             L 6 21
                             Q 6 12, 15 12 Z" 
                          fill="white" stroke="none"/>
                </svg>
                <!-- 이미지 -->
                <div style="position: absolute; top: 15px; left: 15px; width: 50px; height: 50px; 
                            border-radius: 12px; overflow: hidden; pointer-events: none;">
                    <img src="${imageData}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            </div>
        `;
    } else {
        // 이미지가 없는 경우 - 물방울 모양 (크기만 증가)
        pinHTML = `
            <div class="pin-container expanded" style="position: relative; width: 80px; height: 80px;">
                <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 8px rgba(0,0,0,0.4));">
                    <!-- 흰색 바탕 (물방울 모양 - 위가 둥글고 아래가 뾰족) -->
                    <path d="M40 74 C40 74, 12 50, 12 30 C12 15, 24 6, 40 6 C56 6, 68 15, 68 30 C68 50, 40 74, 40 74 Z" 
                          fill="white" stroke="none"/>
                    <!-- 색상이 있는 원 -->
                    <circle cx="40" cy="30" r="22" fill="${color}"/>
                </svg>
                <!-- 이모지 -->
                <div style="position: absolute; top: 9px; left: 15px; width: 50px; height: 50px; 
                            display: flex; align-items: center; justify-content: center; 
                            font-size: 28px; pointer-events: none;">
                    ${emoji}
                </div>
            </div>
        `;
    }
    
    return L.divIcon({
        className: 'custom-saved-pin expanded',
        html: pinHTML,
        iconSize: imageData ? [80, 88] : [80, 80],
        iconAnchor: imageData ? [40, 82] : [40, 74],
        popupAnchor: imageData ? [0, -82] : [0, -74]
    });
}

// 등록된 핀 추가 함수
function addSavedPin(latLng, emoji, color, data) {
    const pinIcon = createCustomPinIcon(emoji, color);
    const expandedIcon = createExpandedPinIcon(emoji, color, data.image);
    
    const marker = L.marker([latLng.lat, latLng.lng], {
        icon: pinIcon
    }).addTo(map);
    
    const pinData = {
        marker: marker,
        latLng: latLng,
        emoji: emoji,
        color: color,
        data: data,
        isExpanded: false,
        pinIcon: pinIcon,
        expandedIcon: expandedIcon,
        stories: [] // 이야기 목록
    };
    
    // 첫 번째 이야기 추가
    if (data.story) {
        pinData.stories.push({
            username: 'User01',
            time: '방금',
            emotion: emoji,
            text: data.story
        });
    }
    
    // 핀 클릭 시 확대/축소
    marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e); // 이벤트 전파 중지
        
        // 다른 핀이 확대되어 있으면 축소
        if (currentExpandedPin && currentExpandedPin !== pinData) {
            currentExpandedPin.marker.setIcon(currentExpandedPin.pinIcon);
            currentExpandedPin.isExpanded = false;
        }
        
        if (pinData.isExpanded) {
            // 축소
            marker.setIcon(pinIcon);
            pinData.isExpanded = false;
            currentExpandedPin = null;
        } else {
            // 확대하고 상세 페이지 표시
            marker.setIcon(expandedIcon);
            pinData.isExpanded = true;
            currentExpandedPin = pinData;
            
            // 상세 페이지 표시
            showPlaceDetailPage(pinData);
        }
    });
    
    // 저장된 핀 배열에 추가
    savedPins.push(pinData);
    
    // 같은 위치(근처)에 있는 핀들을 그룹화하여 감정 투표 수 업데이트
    updateEmotionVotesForLocation(pinData);
    
    console.log('핀 등록 완료:', savedPins.length, '개');
}

// 같은 위치의 감정 투표 수 계산
function updateEmotionVotesForLocation(pinData) {
    const LOCATION_THRESHOLD = 0.0001; // 약 10m 반경
    
    // 같은 위치의 핀들 찾기
    const nearbyPins = savedPins.filter(pin => {
        const latDiff = Math.abs(pin.latLng.lat - pinData.latLng.lat);
        const lngDiff = Math.abs(pin.latLng.lng - pinData.latLng.lng);
        return latDiff < LOCATION_THRESHOLD && lngDiff < LOCATION_THRESHOLD;
    });
    
    // 감정별 투표 수 계산
    const emotionCounts = {
        'happy': 0,
        'disgusted': 0,
        'angry': 0,
        'surprised': 0
    };
    
    nearbyPins.forEach(pin => {
        const emotion = pin.data.emotion;
        if (emotionCounts.hasOwnProperty(emotion)) {
            emotionCounts[emotion]++;
        }
    });
    
    // 총 투표 수
    const totalVotes = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
    
    // 각 핀의 감정 투표 데이터 업데이트
    nearbyPins.forEach(pin => {
        pin.emotionVotes = emotionCounts;
        pin.totalVotes = totalVotes;
    });
}

// 장소 상세 페이지 표시
function showPlaceDetailPage(pinData) {
    const detailPage = document.getElementById('place-detail-sheet');
    
    // 장소 타입 이모지 매핑
    const placeTypeEmojis = {
        'company': '🏢',
        'school': '🏫',
        'entertainment': '🎠',
        'restaurant': '🍽️',
        'other': '🔫'
    };
    
    const placeTypeNames = {
        'company': '회사',
        'school': '학교',
        'entertainment': '놀거리',
        'restaurant': '식당',
        'other': '기타'
    };
    
    // 헤더 정보 설정
    const placeType = pinData.data.placeType || 'other';
    document.getElementById('detail-place-type').textContent = `${placeTypeEmojis[placeType]} ${placeTypeNames[placeType]}`;
    document.getElementById('detail-place-name').textContent = pinData.data.nickname || '이름 없음';
    
    // 주소 가져오기
    getAddressFromCoordinates(pinData.latLng.lat, pinData.latLng.lng)
        .then(address => {
            document.getElementById('detail-place-address').textContent = address;
        })
        .catch(() => {
            document.getElementById('detail-place-address').textContent = `${pinData.latLng.lat.toFixed(6)}, ${pinData.latLng.lng.toFixed(6)}`;
        });
    
    // 태그 정보 - 동적으로 계산
    const tagsContainer = document.getElementById('detail-tags');
    
    const emotionData = {
        'happy': { emoji: '😊', name: '행복한' },
        'disgusted': { emoji: '🤢', name: '우웩' },
        'angry': { emoji: '🔫', name: '화나는' },
        'surprised': { emoji: '😲', name: '놀라는' }
    };
    
    // 감정 투표 데이터 가져오기
    const emotionVotes = pinData.emotionVotes || {};
    const totalVotes = pinData.totalVotes || 1;
    
    // 태그 배열 생성
    const tags = Object.keys(emotionData).map(emotion => {
        const count = emotionVotes[emotion] || 0;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        
        return {
            emoji: emotionData[emotion].emoji,
            name: emotionData[emotion].name,
            count: count,
            percentage: percentage,
            emotion: emotion,
            selected: pinData.data.emotion === emotion
        };
    }).sort((a, b) => b.count - a.count); // 개수 순으로 정렬
    
    tagsContainer.innerHTML = tags.map(tag => `
        <div class="tag-item ${tag.selected ? 'selected' : ''}">
            <span class="tag-emoji">${tag.emoji}</span>
            <div class="tag-info">
                <span class="tag-name">${tag.name}</span>
                <span class="tag-count">${tag.count}표(${tag.percentage}%)</span>
            </div>
        </div>
    `).join('');
    
    // 이야기 정보
    const storiesContainer = document.getElementById('detail-stories');
    storiesContainer.innerHTML = pinData.stories.map((story, index) => `
        <div class="story-item">
            <div class="story-avatar">👤</div>
            <div class="story-content">
                <div class="story-header">
                    <span class="story-username">${story.username}</span>
                    <span class="story-time">· ${story.time}</span>
                    <span class="story-emotion">· ${story.emotion}</span>
                </div>
                <p class="story-text">${story.text}</p>
            </div>
        </div>
    `).join('');
    
    // 페이지 표시
    detailPage.classList.remove('hidden');
    setTimeout(() => {
        detailPage.classList.add('show');
    }, 10);
}

// 장소 상세 페이지 숨기기
function hidePlaceDetailPage() {
    const detailPage = document.getElementById('place-detail-sheet');
    detailPage.classList.remove('show');
    
    // 초기화
    const sheetContent = detailPage.querySelector('.sheet-content');
    sheetContent.style.transform = '';
    sheetContent.style.height = '40vh';
    sheetContent.style.overflowY = 'hidden';
    
    setTimeout(() => {
        detailPage.classList.add('hidden');
    }, 400);
}

// 역지오코딩: 좌표를 주소로 변환하는 함수
async function getAddressFromCoordinates(lat, lng) {
    try {
        // Nominatim API 사용 (OpenStreetMap의 무료 역지오코딩 서비스)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ko`,
            {
                headers: {
                    'User-Agent': 'LANTERVA App' // Nominatim은 User-Agent 헤더를 요구함
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('주소 조회 실패');
        }
        
        const data = await response.json();
        console.log('역지오코딩 결과:', data);
        
        // 한국 주소 포맷으로 변환
        if (data.address) {
            const addr = data.address;
            let addressParts = [];
            
            // 한국 주소 형식: 시/도 > 시/군/구 > 읍/면/동 > 상세주소
            if (addr.city || addr.province) {
                addressParts.push(addr.city || addr.province);
            }
            if (addr.county) {
                addressParts.push(addr.county);
            }
            if (addr.suburb || addr.borough) {
                addressParts.push(addr.suburb || addr.borough);
            }
            if (addr.neighbourhood || addr.quarter) {
                addressParts.push(addr.neighbourhood || addr.quarter);
            }
            if (addr.road) {
                addressParts.push(addr.road);
            }
            if (addr.house_number) {
                addressParts.push(addr.house_number);
            }
            
            // 주소가 있으면 반환, 없으면 display_name 사용
            if (addressParts.length > 0) {
                return addressParts.join(' ');
            } else {
                // display_name을 한국어로 정리
                let displayName = data.display_name;
                // 불필요한 부분 제거
                displayName = displayName.replace(/, South Korea$/, '');
                displayName = displayName.replace(/, 대한민국$/, '');
                return displayName;
            }
        }
        
        // 주소를 찾지 못한 경우 좌표 표시
        return `좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
    } catch (error) {
        console.error('역지오코딩 오류:', error);
        throw error;
    }
}