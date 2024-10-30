# image_processor/processor.py
from collections import Counter, defaultdict
import os
from PIL import Image
import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont
from colorspacious import cspace_convert
from colormath.color_objects import LabColor
from colormath.color_diff import delta_e_cie2000
from pyciede2000 import ciede2000


# 计算平均颜色
def average_color(image_block):
    np_block = np.array(image_block)
    avg_color = np.mean(np_block, axis=(0, 1))  # 计算每个通道的平均值
    return tuple(map(int, avg_color))

# 将RGB颜色转换为最接近的16进制颜色
def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])


def process_image(image_path, block_size):
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

        # 返回处理后的图片
        return new_img

def rgb_to_tuple(rgb_str):
    """将16进制颜色字符串转换为RGB元组"""
    return tuple(int(rgb_str[i:i+2], 16) for i in (1, 3, 5))

def color_difference(color1, color2):
    """计算两个颜色之间的欧几里得距离"""
    return np.sqrt(sum((a - b) ** 2 for a, b in zip(color1, color2)))

def color_difference_ciede2000(color1, color2):
    """
    计算两个颜色之间的 CIEDE2000 色差
    :param color1: 第一个颜色 (RGB, 范围 0-255)
    :param color2: 第二个颜色 (RGB, 范围 0-255)
    :return: CIEDE2000 颜色差异
    """
    # 将 RGB 颜色转换为 Lab 颜色空间
    lab1 = cspace_convert(color1, "sRGB255", "CIELab")
    lab2 = cspace_convert(color2, "sRGB255", "CIELab")

    # 计算 CIEDE2000 色差
    delta_e = ciede2000(lab1, lab2)['delta_E_00']
    
    return delta_e

def find_closest_color(avg_color, color_data):
    """找到与给定颜色最相似的颜色"""
    min_diff = float('inf')
    closest_color = None
    closest_code = None
    
    for color_code, color_hex in color_data.items():
        color_rgb = rgb_to_tuple(color_hex)
        diff = color_difference_ciede2000(avg_color, color_rgb)
        if diff < min_diff:
            min_diff = diff
            closest_color = color_hex
            closest_code = color_code
    
    return closest_color,closest_code

def add_hash_prefix(color_hex):
    """给颜色字符串添加 # 前缀"""
    if not color_hex.startswith('#'):
        return '#' + color_hex
    return color_hex

def process_image_with_limited_color(image_path, block_size):
    # 打开图片并转换为RGB模式
    with Image.open(image_path) as img:
        img = img.convert('RGB')
        width, height = img.size

        # 创建一个新图片用于存放处理后的结果
        new_img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(new_img)
        # 尝试加载默认字体
        try:
            font = ImageFont.load_default()
        except IOError:
            font = ImageFont.load_default()  # 使用内置字体

        # 读取CSV文件到DataFrame
        color_df = pd.read_csv('color.csv', header=None, names=['ColorHex', 'ColorCode'])
        
        # 将颜色数据转换为字典
        color_data = {code: add_hash_prefix(hex) for code, hex in zip(color_df['ColorCode'], color_df['ColorHex'])}

        # 遍历所有区块
        for y in range(0, height, block_size):
            for x in range(0, width, block_size):
                # 定义当前区块的区域
                box = (x, y, x + block_size, y + block_size)
                block = img.crop(box)
                
                # 计算区块的平均颜色
                avg_color_rgb = average_color(block)
                
                # 找到与给定颜色最相似的16进制颜色
                closest_color,closest_code = find_closest_color(avg_color_rgb, color_data)

                new_block = Image.new('RGB', (block_size, block_size), closest_color)
                
                # 将新区块粘贴到结果图片上
                new_img.paste(new_block, box)

                # 在图像块上绘制颜色代码
                text_bbox = draw.textbbox((x, y), closest_code, font=font)
                text_width = text_bbox[2] - text_bbox[0]
                text_height = text_bbox[3] - text_bbox[1]
                text_x = x + (block_size - text_width) / 2
                text_y = y + (block_size - text_height) / 2
                draw.text((text_x, text_y), closest_code, fill='black', font=font)

        # 返回处理后的图片
        return new_img
    
def get_colorNumber_with_limited_color(image_path, block_size):

    # 打开图片并转换为RGB模式
    with Image.open(image_path) as img:
        img = img.convert('RGB')
        width, height = img.size

        # 尝试加载默认字体
        try:
            font = ImageFont.load_default()
        except IOError:
            font = ImageFont.load_default()  # 使用内置字体

        # 读取CSV文件到DataFrame
        color_df = pd.read_csv('color.csv', header=None, names=['ColorHex', 'ColorCode'])
        
        # 将颜色数据转换为字典
        color_data = {code: add_hash_prefix(hex) for code, hex in zip(color_df['ColorCode'], color_df['ColorHex'])}

        # 初始化颜色计数器
        color_counter = defaultdict(int)
        
        # 遍历所有区块
        for y in range(0, height, block_size):
            for x in range(0, width, block_size):
                # 定义当前区块的区域
                box = (x, y, x + block_size, y + block_size)
                block = img.crop(box)
                
                # 计算区块的平均颜色
                avg_color_rgb = average_color(block)
                
                # 找到与给定颜色最相似的16进制颜色
                closest_color,closest_code = find_closest_color(avg_color_rgb, color_data)

                # 增加计数
                color_counter[closest_code] += 1

        # 将结果字典整理成需要的格式
        result = {
            'color_number': {
                code: {
                    'color': color_data.get(code, None),  # 从 color_data 获取颜色
                    'count': color_counter.get(code, 0)   # 从 color_counter 获取计数
                } for code in color_counter
            }
        }
        # 返回处理后的图片
        return result
    

def most_frequent_color(image):
    '''
    tool function
    '''
    # 将图像数据转换为像素列表
    pixels = list(image.getdata())
    
    # 统计每种颜色的出现频率
    color_counts = Counter(pixels)
    
    # 找到出现频率最高的颜色
    most_common_color = color_counts.most_common(1)[0][0]

    return most_common_color


def countColorsLimits(img, selected_grids,block_size,type,colorMode):
    img = img.convert('RGB')
    width, height = img.size

    # 尝试加载默认字体
    try:
        font = ImageFont.load_default()
    except IOError:
        font = ImageFont.load_default()  # 使用内置字体

    # type影响读哪一个csv文件
    color_df = pd.read_csv('mard96.csv', header=None, names=['ColorHex', 'ColorCode'])
    if type == 'mard&黄豆豆家 96 色':
        color_df = pd.read_csv('mard96.csv', header=None, names=['ColorHex', 'ColorCode'])
    elif type == 'mard&黄豆豆家 全 色':
        color_df = pd.read_csv('mardAll.csv', header=None, names=['ColorHex', 'ColorCode'])
    
    # 将颜色数据转换为字典
    color_data = {code: add_hash_prefix(hex) for code, hex in zip(color_df['ColorCode'], color_df['ColorHex'])}

    # 初始化颜色计数器
    color_counter = defaultdict(int)

    # 创建一个空图像作为底图
    draw_img = Image.new('RGBA', (width, height), color=(0,0,0,0))  
    draw = ImageDraw.Draw(draw_img)
    
    # 遍历选中的区块
    for grid in selected_grids:
        x, y, width, height = grid['x'], grid['y'], float(block_size), float(block_size)
        # 这里的处理是担心边边会有颜色污染
        x+=1
        y+=1
        width-=2
        height-=2
        
        # 定义当前区块的区域
        box = (x, y, x + width, y + height)
        block = img.crop(box)
        
        # 计算区块的颜色
        most_color_rgb = most_frequent_color(block)
        if colorMode == '平均取色':
            most_color_rgb = average_color(block)
        elif colorMode =='最大取色':
            most_color_rgb = most_frequent_color(block)

        # 找到与给定颜色最相似的16进制颜色
        closest_color, closest_code = find_closest_color(most_color_rgb, color_data)

        # 增加计数
        color_counter[closest_code] += 1

        # 绘制填充矩形
        draw.rectangle(box, fill=closest_color, outline='black')
        
        # 绘制颜色代码
        text = f'{closest_code}'
        draw.text((x + 5, y + 5), text, fill='black', font=font)

    # 将结果字典整理成需要的格式
    result = {
        'color_number': {
            code: {
                'color': color_data.get(code, None),  # 从 color_data 获取颜色
                'count': color_counter.get(code, 0)   # 从 color_counter 获取计数
            } for code in color_counter
        }
    }
    # 提取首字母和数字部分，用于排序
    def sort_by_code(code):
        # 提取首字母和数字部分
        if not code:
            return ('', 0)
        letter = code[0]
        number = int(code[1:]) if code[1:].isdigit() else 0
        return (letter, number)

    # 对 color_number 按照 code 排序
    sorted_color_number = dict(sorted(result['color_number'].items(), key=lambda item: sort_by_code(item[0])))
    result['color_number'] = sorted_color_number
            
    return result, draw_img

