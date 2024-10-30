
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const canvas = document.getElementById('canvas-container');
    const ctx = canvas.getContext('2d');
    const gridSizeInput = document.getElementById('grid-size');
    const gridSizeValue = document.getElementById('grid-size-value');
    const gridSizeNumberInput = document.getElementById('grid-size-number');
    const gridXOffsetInput = document.getElementById('grid-x-offset');
    const gridXOffsetValue = document.getElementById('grid-x-offset-value');
    const gridXOffsetNumberInput = document.getElementById('grid-x-offset-number');
    const gridYOffsetInput = document.getElementById('grid-y-offset');
    const gridYOffsetValue = document.getElementById('grid-y-offset-value');
    const gridYOffsetNumberInput = document.getElementById('grid-y-offset-number');
    const lockButton = document.getElementById('lock-button');
    const countButtonDiv = document.getElementById('countButton')


    let img = new Image();
    let gridSize = parseFloat(gridSizeInput.value);
    let gridXOffset = parseFloat(gridXOffsetInput.value);
    let gridYOffset = parseFloat(gridYOffsetInput.value);
    let isLocked = false;
    let selectedGrids = []; // Array to store selected grid cells
    let imgWidth = 0;
    let imgHeight = 0;


    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                img.onload = () => {
                    // 设置画布的宽度和高度与图片一致
                    canvas.width = img.width;
                    canvas.height = img.height;
    
                    imgWidth = img.width;
                    imgHeight = img.height;
    
                    drawImageWithGrid();
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        }
    });

    /**
     * 这里是选中区块之后的区块变化
     */
    function drawImageWithGrid() {
        // 清除画布之前的内容
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        // 将之前加载的图片 (img) 绘制到画布上
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
        // Draw the grid
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
    
        // Vertical lines
        for (let x = gridSize - gridXOffset % gridSize; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
    
        // Horizontal lines
        for (let y = gridSize - gridYOffset % gridSize; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    
        // 高亮显示选中的区块
        if (selectedGrids.length > 0) {
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            selectedGrids.forEach(grid => {
                // Fill the selected grid with a semi-transparent blue color
                ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'; // Semi-transparent blue
                ctx.fillRect(grid.x, grid.y, gridSize, gridSize);

                // Draw the border around the selected grid
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.beginPath();//开始绘制每个选中区块的边框
                ctx.moveTo(grid.x, grid.y);
                ctx.lineTo(grid.x + gridSize, grid.y);
                ctx.lineTo(grid.x + gridSize, grid.y + gridSize);
                ctx.lineTo(grid.x, grid.y + gridSize);
                ctx.lineTo(grid.x, grid.y);
                ctx.stroke();
            });
        }
    }
    
    
    // 点击画布区块之后
    function handleCanvasClick(event) {
        if (isLocked) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Calculate which grid cell is clicked
            const gridSize = parseFloat(gridSizeInput.value);
            const xOffset = parseFloat(gridXOffsetInput.value);
            const yOffset = parseFloat(gridYOffsetInput.value);

            const cellX = Math.floor((x + xOffset) / gridSize) * gridSize - xOffset;
            const cellY = Math.floor((y + yOffset) / gridSize) * gridSize - yOffset;

            // Check if the grid cell is already selected
            const index = selectedGrids.findIndex(grid => grid.x === cellX && grid.y === cellY);

            if (index > -1) {
                // Remove the grid cell if it is already selected
                selectedGrids.splice(index, 1);
            } else {
                // Add the grid cell to selected list
                selectedGrids.push({ x: cellX, y: cellY });
            }

            drawImageWithGrid();
        }
    }

    // 初始化状态变量
    let isMouseDown = false;

    // 更新 handleCanvasClick 函数以处理拖拽选择
    function handleCanvasMouseMove(event) {
        if (isLocked && isMouseDown) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Calculate which grid cell is hovered
            const gridSize = parseFloat(gridSizeInput.value);
            const xOffset = parseFloat(gridXOffsetInput.value);
            const yOffset = parseFloat(gridYOffsetInput.value);

            const cellX = Math.floor((x + xOffset) / gridSize) * gridSize - xOffset;
            const cellY = Math.floor((y + yOffset) / gridSize) * gridSize - yOffset;

            // Toggle the grid cell in the selection
            const index = selectedGrids.findIndex(grid => grid.x === cellX && grid.y === cellY);

            if (index > -1) {
                // Remove the grid cell if it is already selected
                //selectedGrids.splice(index, 1);
            } else {
                // Add the grid cell to the selected list
                selectedGrids.push({ x: cellX, y: cellY });
            }

            drawImageWithGrid();
        }
    }

    function handleMouseDown(event) {
        if (isLocked && event.button === 0) { // Left mouse button
            isMouseDown = true;
            handleCanvasMouseMove(event); // Handle current position
        }
    }

    function handleMouseUp() {
        if (isLocked) {
            isMouseDown = false;
        }
    }

    // 事件监听器
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    function updateGridSize() {
        gridSize = parseFloat(gridSizeInput.value);
        gridSizeValue.textContent = gridSize;
        gridSizeNumberInput.value = gridSize;
        drawImageWithGrid();
    }

    function updateGridXOffset() {
        gridXOffset = parseFloat(gridXOffsetInput.value);
        gridXOffsetValue.textContent = gridXOffset;
        gridXOffsetNumberInput.value = gridXOffset;
        drawImageWithGrid();
    }

    function updateGridYOffset() {
        gridYOffset = parseFloat(gridYOffsetInput.value);
        gridYOffsetValue.textContent = gridYOffset;
        gridYOffsetNumberInput.value = gridYOffset;
        drawImageWithGrid();
    }



    gridSizeInput.addEventListener('input', updateGridSize);
    gridSizeNumberInput.addEventListener('input', function() {
        const value = parseFloat(gridSizeNumberInput.value);
        if (!isNaN(value)) {
            gridSizeInput.value = value;
            updateGridSize();
        }
    });

    gridXOffsetInput.addEventListener('input', updateGridXOffset);
    gridXOffsetNumberInput.addEventListener('input', function() {
        const value = parseFloat(gridXOffsetNumberInput.value);
        if (!isNaN(value)) {
            gridXOffsetInput.value = value;
            updateGridXOffset();
        }
    });

    gridYOffsetInput.addEventListener('input', updateGridYOffset);
    gridYOffsetNumberInput.addEventListener('input', function() {
        const value = parseFloat(gridYOffsetNumberInput.value);
        if (!isNaN(value)) {
            gridYOffsetInput.value = value;
            updateGridYOffset();
        }
    });

    // 点击锁定按钮之后
    lockButton.addEventListener('click', function() {
        isLocked = !isLocked;
        if (isLocked) {
            lockButton.textContent = 'Unlock';
            canvas.addEventListener('click', handleCanvasClick);

            // Create and add the "Generate" button
            const generateButton = document.createElement('button');
            generateButton.textContent = '生成';
            generateButton.addEventListener('click', sendSelectedGrids);

            // 这里要生成一个选项，是商家+数量
            const options = [
                { value: 'mard&黄豆豆家 96 色', label: 'mard&黄豆豆家 96 色' },
                { value: 'mard&黄豆豆家 全 色', label: 'mard&黄豆豆家 全 色' }
            ];

            // Generate radio buttons
            options.forEach((option, index) => {
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = 'dynamicOptions';
                radioInput.value = option.value;
                radioInput.id = option.value;

                // Set the first option as checked by default
                if (index === 0) {
                    radioInput.checked = true;
                }

                const radioLabel = document.createElement('label');
                radioLabel.htmlFor = option.value;
                radioLabel.textContent = option.label;

                countButtonDiv.appendChild(radioInput);
                countButtonDiv.appendChild(radioLabel);
                countButtonDiv.appendChild(document.createElement('br')); // Line break for readability
            });

            // 这里是平均取色和最大取色的选择
            const modeOptions = [
                { value: '平均取色', label: '平均取色' },
                { value: '最大取色', label: '最大取色' }
            ];
            modeOptions.forEach((option, index) => {
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = 'dynamicOptions2';
                radioInput.value = option.value;
                radioInput.id = option.value;

                // Set the first option as checked by default
                if (index === 0) {
                    radioInput.checked = true;
                }

                const radioLabel = document.createElement('label');
                radioLabel.htmlFor = option.value;
                radioLabel.textContent = option.label;

                countButtonDiv.appendChild(radioInput);
                countButtonDiv.appendChild(radioLabel);
                countButtonDiv.appendChild(document.createElement('br')); // Line break for readability
            });


            countButtonDiv.appendChild(generateButton);
        } else {
            lockButton.textContent = 'Lock';
            canvas.removeEventListener('click', handleCanvasClick);
            selectedGrids = [];
            drawImageWithGrid();
            
            const existingButton = countButtonDiv.querySelector('button');
            if (existingButton) {
                countButtonDiv.removeChild(existingButton);
            }
            countButtonDiv.replaceChildren();
        }
    });



    // 点击发送之后 发送图像 和 选中的区块
    function sendSelectedGrids() {
        // 创建新画布来创造图像信息
        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = canvas.width;
        hiddenCanvas.height = canvas.height;
        const hiddenCtx = hiddenCanvas.getContext('2d');
        hiddenCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Convert the image to a data URL
        const imageDataURL = hiddenCanvas.toDataURL('image/png');

        // Prepare the FormData object
        const formData = new FormData();

        // 这里选择的图像不要是画板图像而是真实的图像，不然会有线的颜色来扰乱
        formData.append('image', imageDataURL);

        // 这里是加选择的区块选项
        formData.append('selectedGrids', JSON.stringify(selectedGrids));
        // 这里加一个区块大小信息
        formData.append('blockSize',gridSize)

        // 加一个豆子选项信息
        const selectedRadio = document.querySelector('input[name="dynamicOptions"]:checked');
        formData.append('type',selectedRadio.value)
        // 再加一个取色选项信息
        const selectedRadio2 = document.querySelector('input[name="dynamicOptions2"]:checked');
        formData.append('colorMode',selectedRadio2.value)

        // Send the FormData object to the server
        fetch('/countColors', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.json(); // 解析 JSON 数据
            } else {
                throw new Error('Network response was not ok.');
            }
        })
        .then(data => {
            console.log('Success:', data);
            // 处理返回的数据，例如显示图像或其他
            const imgElement = document.createElement('img');
            imgElement.src = data.image;

            outputdiv = document.getElementById('output_img');
            outputdiv.innerHTML = '';
            outputdiv.appendChild(imgElement); // 将图像添加到页面上
            displayResult(data.result)
            placeDownloadButton(data.image,data.result)
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }



    // 展示返回的color信息
    function displayResult(result) {
        const outputDiv = document.getElementById('output_img');
        // 创建表格元素
        const table = document.createElement('table');
        table.border = '1';
        
        // 创建表头
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        const headers = ['Color Code', 'Color', 'Count'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);
        
        // 创建表体
        const tbody = document.createElement('tbody');
        Object.keys(result.color_number).forEach(code => {
            const row = document.createElement('tr');
            
            const colorData = result.color_number[code];
            
            // Color Code
            const tdCode = document.createElement('td');
            tdCode.textContent = code;
            row.appendChild(tdCode);
            
            // Color
            const tdColor = document.createElement('td');
            tdColor.textContent = colorData.color;
            tdColor.style.backgroundColor = colorData.color;
            tdColor.style.color = '#fff';
            row.appendChild(tdColor);
            
            // Count
            const tdCount = document.createElement('td');
            tdCount.textContent = colorData.count;
            row.appendChild(tdCount);
            
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
    
        // 将表格添加到 outputDiv
        outputDiv.appendChild(table);
    }

    function placeDownloadButton(img,result)
    {
        // 创建一个 Canvas 元素来放两个东西,图像和色号
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 加载图像并绘制到 Canvas 上
        const d_img = new Image();
        const colorKeys = Object.keys(result.color_number);
        d_img.src = img;
        d_img.onload = function() {
            let tableX = d_img.width + 10; // 表格绘制起点 X 坐标
            const tableY = 10; // 起点 Y 坐标
            const cellWidth = 60; // 单元格宽度
            const cellHeight = 40; // 单元格高度
            canvas.height = d_img.height+20;
            // 得到循环步长
            const step = Math.floor(ctx.canvas.height/cellHeight) -1
            const colorLength = Object.keys(result.color_number).length
            let colorTeam = Math.floor(colorLength/step) + 1;
            canvas.width = d_img.width + 180*colorTeam+20;
            
    
            // 绘制图像到 Canvas 上
            ctx.drawImage(d_img, 0, 0);
    

            

            // 用来下标+1重新启动表头
            
            for(let i = 0; i < colorLength; i++) {
                
                // 表头单元格宽度
                const headers = ['色号', '色板', '数量'];
                const headerWidth = headers.length * cellWidth;

                // 绘制表头背景
                ctx.fillStyle = '#f0f0f0'; // 表头背景颜色
                ctx.fillRect(tableX, tableY, headerWidth, cellHeight);

                // 绘制表头边框
                ctx.strokeStyle = 'black';
                ctx.strokeRect(tableX, tableY, headerWidth, cellHeight);

                ctx.fillStyle = 'black';
                ctx.font = '16px Arial';
                ctx.textBaseline = 'middle';

                headers.forEach((header, i) => {
                    ctx.fillText(header, tableX + i * cellWidth + 10, tableY + cellHeight / 2);
                    
                    // 绘制表头单元格边框
                    ctx.strokeRect(tableX + i * cellWidth, tableY, cellWidth, cellHeight);
                });
                // 绘制表体
                let y = tableY + cellHeight;
                let tempj
                // 用来给每个 加表体
                for(let j = 0; (j < step)&&(i+j<colorLength); j++) {
                    const colorData = result.color_number[colorKeys[i+j]];
                    // 绘制单元格背景
                    ctx.fillStyle = '#ffffff'; // 单元格背景颜色
                    ctx.fillRect(tableX, y, headerWidth, cellHeight);
                    
                    // 绘制单元格边框
                    ctx.strokeRect(tableX, y, headerWidth, cellHeight);

                    // 绘制表格内容
                    ctx.fillStyle = 'black';
                    ctx.fillText(colorKeys[i+j], tableX + 10, y + cellHeight / 2);
                    ctx.fillStyle = colorData.color;
                    ctx.fillRect(tableX + 75, y + 10, 30, 30); // Color cell
                    ctx.fillStyle = 'black';
                    ctx.fillText( colorData.count, tableX + 140, y + cellHeight / 2);

                    // 绘制单元格边框
                    ctx.strokeRect(tableX, y, headerWidth, cellHeight);

                    y += cellHeight;
                    tempj = j
                }
                // 绘制表格右边框
                ctx.strokeRect(tableX, tableY, headerWidth, y - tableY);
                i = i+tempj
                tableX += 180 // 下一列往右边移动
            }

         // 创建并添加一个下载按钮
         const downloadButton = document.createElement('a');
         downloadButton.href = canvas.toDataURL('image/png');
         downloadButton.download = 'color_distribution.png';
         downloadButton.textContent = '导出';
         const outputDiv = document.getElementById('output_img');
         outputDiv.appendChild(downloadButton);
        }
    }
});

