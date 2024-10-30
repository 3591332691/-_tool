// static/js/script.js
// 获取模态窗口和相关元素
const modal = document.getElementById('myModal');
const modalImg = document.getElementById('modal-image');
const closeBtn = document.getElementsByClassName('close')[0];

// 点击图片时打开模态窗口
function openModal() {
    modal.style.display = "block";
    modalImg.src = document.getElementById('uploaded-image').src;
}
function openModal2() {
    modal.style.display = "block";
    modalImg.src = document.getElementById('downloaded-image').src;
}

// 点击关闭按钮时关闭模态窗口
function closeModal() {
    modal.style.display = "none";
}

// 点击模态窗口外部时也关闭模态窗口
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
// 点击生成像素图片按钮
function generatePhoto() {
    // 得到像素步长
    const blockSize = document.getElementById('number-input').value;
    fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ block_size: blockSize })
    })
    .then(response => response.json())
    .then(data => {
        if (data.downloaded_image_path) {
            console.log(data.downloaded_image_path)
            document.getElementById('downloaded-image').src = `${data.downloaded_image_path}?t=${new Date().getTime()}`;
        } else {
            console.error('No generated image found.');
        }
        if(data.color_number){
            const numberMessageDiv = document.getElementById('number-message');
            numberMessageDiv.innerHTML = '';  // 清空现有内容
    
            // 遍历 color_number 对象
            console.log('data.color_number:',data.color_number)
            for (const [colorCode, colorInfo] of Object.entries(data.color_number.color_number)) {
                console.log('colorCode:',colorCode, colorInfo)
                const colorInfoDiv = document.createElement('div');
                colorInfoDiv.style.display = 'flex';
                colorInfoDiv.style.alignItems = 'center';
                colorInfoDiv.style.marginBottom = '10px';

                // 创建颜色块
                const colorBlock = document.createElement('img');
                colorBlock.src = generateColorBlock(colorInfo.color);
                colorBlock.style.width = '20px'; // 颜色块的宽度
                colorBlock.style.height = '20px'; // 颜色块的高度
                colorBlock.style.marginRight = '10px'; // 颜色块和文本之间的间距

                // 创建颜色信息文本
                const colorText = document.createElement('p');
                colorText.textContent = `${colorCode}: ${colorInfo.count}`;
                colorText.style.margin = '0'; // 去除默认的段落边距

                // 添加颜色块和文本到 div
                colorInfoDiv.appendChild(colorBlock);
                colorInfoDiv.appendChild(colorText);

                // 将 div 添加到页面中
                numberMessageDiv.appendChild(colorInfoDiv);
            }
        }
    })
    .catch(error => console.error('Error:', error));
}


// 辅助函数：生成颜色块的 base64 图像
function generateColorBlock(colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 20; // 颜色块的宽度
    canvas.height = 20; // 颜色块的高度
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png'); // 返回 base64 数据
}

