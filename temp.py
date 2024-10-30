import os
from PIL import Image
import numpy as np

# 计算平均颜色
def average_color(image_block):
    np_block = np.array(image_block)
    avg_color = np.mean(np_block, axis=(0, 1))  # 计算每个通道的平均值
    return tuple(map(int, avg_color))

# 将RGB颜色转换为最接近的16进制颜色
def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def process_image(image_path, output_path, block_size=40):
    # 打开图片并转换为RGB模式
    with Image.open(image_path) as img:
        img = img.convert('RGB')
        width, height = img.size

        # 创建一个新图片用于存放处理后的结果
        new_img = Image.new('RGB', (width, height))

        # 遍历所有区块
        for y in range(0, height, block_size):
            for x in range(0, width, block_size):
                # 定义当前区块的区域
                box = (x, y, x + block_size, y + block_size)
                block = img.crop(box)
                
                # 计算区块的平均颜色
                avg_color = average_color(block)
                
                # 填充新的颜色
                color_hex = rgb_to_hex(avg_color)
                new_block = Image.new('RGB', (block_size, block_size), color_hex)
                
                # 将新区块粘贴到结果图片上
                new_img.paste(new_block, box)

        # 保存处理后的图片
        new_img.save(output_path)

def process_all_images(input_dir, output_dir, block_size=80):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            process_image(input_path, output_path, block_size)

# 使用示例
input_directory = 'photos'
output_directory = 'produce'


process_all_images(input_directory, output_directory)
