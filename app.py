import base64
import io
import re
from PIL import Image
from flask import Flask, json, render_template, request, jsonify, send_from_directory, url_for
import os
from image_processor import process_image_with_limited_color,get_colorNumber_with_limited_color,countColorsLimits
app = Flask(__name__)

# 配置文件夹路径
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['DOWNLOAD_FOLDER'] = 'static/downloads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# 这里是上传到 
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'No file part', 400
        file = request.files['file']
        if file.filename == '':
            return 'No selected file', 400
        if file and allowed_file(file.filename):
            # 确保 uploads 文件夹里只有一个文件
            upload_folder = app.config['UPLOAD_FOLDER']
            existing_files = os.listdir(upload_folder)
            
            # 删除已有的文件（如果有）
            for existing_file in existing_files:
                os.remove(os.path.join(upload_folder, existing_file))
            
            # 保存新的文件
            filename = file.filename
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)

    # 检查 downloads 文件夹中的文件
    downloaded_files = os.listdir(app.config['DOWNLOAD_FOLDER'])
    downloaded_image_path = None
    if downloaded_files:
        downloaded_image_filename = downloaded_files[0]  # 只取第一个文件
        downloaded_image_path = os.path.join('static', 'downloads', downloaded_image_filename)
    
    # 传递downloads和uploads的图片路径到前端
    uploaded_files = os.listdir(app.config['UPLOAD_FOLDER'])
    filename = uploaded_files[0] if uploaded_files else None
    return render_template('index.html', filename=filename, downloaded_image_path=downloaded_image_path)

@app.route('/generate', methods=['POST'])
def generate_photo():
    data = request.get_json()  # 从请求体中获取 JSON 数据
    block_size = data.get('block_size', 60)  # 获取 block_size 参数，默认为 60
    block_size = int(block_size) # 确保是int类型的

    # 对已经上传的做处理
    uploaded_files = os.listdir(app.config['UPLOAD_FOLDER'])
    if uploaded_files:
        # 取第一个上传的文件
        input_filename = uploaded_files[0]
        input_file_path = os.path.join(app.config['UPLOAD_FOLDER'], input_filename)

        # 获取处理后的图片
        new_image = process_image_with_limited_color(input_file_path, block_size)
        diction = get_colorNumber_with_limited_color(input_file_path, block_size)
        # 设置输出文件的路径和名称
        output_filename = f"pixelated_{input_filename}"
        output_file_path = os.path.join(app.config['DOWNLOAD_FOLDER'], output_filename)

        # 确保 uploads 文件夹里只有一个文件
        existing_files = os.listdir(app.config['DOWNLOAD_FOLDER'])
        for existing_file in existing_files:
            os.remove(os.path.join(app.config['DOWNLOAD_FOLDER'], existing_file))
        new_image.save(output_file_path)

        return jsonify({'downloaded_image_path':output_file_path,'color_number':diction})
    else:
        return jsonify({'error': 'No image found.'}), 404

@app.route('/downloads/<filename>')
def download_file(filename):
    return send_from_directory(app.config['DOWNLOAD_FOLDER'], filename)


@app.route('/countsFromPhoto')
def counts_from_photo():
    return render_template('countsFromPhoto.html')

def convert_image_to_base64(img):
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return img_base64



@app.route('/countColors', methods=['POST'])
def countColors():
    # 获取请求中的数据
    image_data_url = request.form.get('image')
    selected_grids = request.form.get('selectedGrids')
    block_size = request.form.get('blockSize')
    type = request.form.get('type')
    colorMode = request.form.get('colorMode')
    # 解析选中的区块信息
    if selected_grids:
        selected_grids = json.loads(selected_grids)  # 将 JSON 字符串解析为 Python 对象

    # 处理图像数据
    if image_data_url:
        # 移除数据 URL 前缀
        image_data = re.sub('^data:image/png;base64,', '', image_data_url)
        # 解码 base64 数据
        image_data = base64.b64decode(image_data)
        # 将图像数据转换为 Image 对象
        image = Image.open(io.BytesIO(image_data))
        
        # 这里调用打包里面的函数
        result, draw_img = countColorsLimits(image,selected_grids,block_size,type,colorMode)
        
        img_base64 = convert_image_to_base64(draw_img)
        response = {
            'result': result,
            'image': f'data:image/png;base64,{img_base64}'
        }
        
        return jsonify(response)

    return jsonify({'message': 'fail'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


