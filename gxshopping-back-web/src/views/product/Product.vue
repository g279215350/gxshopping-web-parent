<template>
    <section>
        <!--工具条-->
        <el-col :span="24" class="toolbar" style="padding-bottom: 0px;">
            <el-form :inline="true" :model="filters">
                <el-form-item>
                    <el-input v-model="filters.keyword" placeholder="关键字"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" v-on:click="getProducts">查询</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleAdd">新增</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleViewProperties">显示属性维护</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSkuProperties">Sku维护</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleOnSale">上架</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleOffSale">下架</el-button>
                </el-form-item>
            </el-form>
        </el-col>

        <!--列表-->
        <el-table :data="products" highlight-current-row v-loading="listLoading" @select="selChange" @selection-change="selsChange" style="width: 100%;">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column type="index" label="序号" width="80">
            </el-table-column>
            <el-table-column prop="name" label="主标题" width="400" sortable>
            </el-table-column>
            <el-table-column prop="subName" label="副标题" width="260" sortable>
            </el-table-column>
            <el-table-column prop="productType.name" label="商品类型" width="120" sortable>
            </el-table-column>
            <el-table-column prop="brand.name" label="商品名称" width="120" sortable>
            </el-table-column>
            <el-table-column prop="state" label="状态" width="100" sortable>
                <template scope="scope">
                    <span v-if="scope.row.state == 0" style="color: orange">未上架</span>
                    <span v-if="scope.row.state == 1" style="color: limegreen">已上架</span>
                    <span v-if="scope.row.state == 2" style="color: red">已下架</span>
                </template>
            </el-table-column>
            <el-table-column prop="onSaleTime" label="上架时间" width="170" sortable :formatter="onSaleTimeFm">
            </el-table-column>
            <el-table-column prop="offSaleTime" label="下架时间" min-width="170" sortable :formatter="offSaleTimeFm">
            </el-table-column>
            <el-table-column label="操作" width="150">
                <template scope="scope">
                    <el-button v-if="scope.row.state!=1" size="small" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
                    <el-button v-if="scope.row.state!=1" type="danger" size="small" @click="handleDel(scope.$index, scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!--工具条-->
        <el-col :span="24" class="toolbar">
            <el-button type="danger" @click="batchRemove" :disabled="this.sels.length===0">批量删除</el-button>
            <el-pagination layout="prev, pager, next" @current-change="handleCurrentChange" :page-size="pageSize" :total="total" style="float:right;">
            </el-pagination>
        </el-col>

        <!--新增和修改界面-->
        <el-dialog title="更新" v-model="changeFormVisible" :close-on-click-modal="false">
            <el-form :model="changeForm" label-width="80px" :rules="changeFormRules" ref="changeForm">
                <el-form-item label="主标题" prop="name">
                    <el-input v-model="changeForm.name" auto-complete="off"></el-input>
                </el-form-item>
                <el-form-item label="副标题" prop="subName">
                    <el-input v-model="changeForm.subName" auto-complete="off"></el-input>
                </el-form-item>
                <el-form-item label="商品类型">
                    <el-cascader
                            :clearable="true"
                            change-on-select
                            :show-all-levels="false"
                            expand-trigger="hover"
                            :options="options"
                            v-model="changeForm.selectedOptions"
                            :props="defaultProps">
                    </el-cascader>
                </el-form-item>
                <el-form-item label="商品品牌">
                    <el-select v-model="changeForm.brandId" clearable placeholder="请选择商品品牌">
                        <el-option
                                v-for="item in brands"
                                :label="item.name"
                                :value="item.id">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="展示图片">
                    <el-upload
                            action="http://localhost:8100/services/common/file"
                            list-type="picture-card"
                            :on-success="fileUploaded"
                            :on-preview="picPreview"
                            :before-upload="beforeUpload"
                            :on-remove="removePic"
                            :file-list="showFileList">
                        <i class="el-icon-plus"></i>
                    </el-upload>
                    <el-dialog v-model="dialogVisible" size="tiny">
                        <img width="100%" :src="imageUrl" alt="">
                    </el-dialog>
                </el-form-item>
                <el-form-item label="商品描述">
                    <el-input type="textarea" v-model="changeForm.ext.description" auto-complete="off"></el-input>
                </el-form-item>
                <el-form-item label="商品详情">
                    <quill-editor
                            ref="QuillEditor"
                            v-model="changeForm.ext.richContent">
                    </quill-editor>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click.native="changeFormVisible = false">取消</el-button>
                <el-button type="primary" @click.native="changeSubmit" :loading="changeLoading">提交</el-button>
            </div>
        </el-dialog>

        <!--显示属性维护模态窗-->
        <el-dialog v-model="viewPropertiesVisible" size="tiny">

            <el-form label-width="80px">
                <el-form-item v-for="viewProperty in viewProperties" :label="viewProperty.specName">
                    <el-input  v-model="viewProperty.value" auto-complete="off"></el-input>
                </el-form-item>
            </el-form>

            <div slot="footer" class="dialog-footer">
                <el-button @click.native="viewPropertiesVisible = false">取消</el-button>
                <el-button type="primary" @click.native="changeViewProperties" :loading="changeLoading">提交</el-button>
            </div>
        </el-dialog>

        <!--Sku属性维护模态窗-->
        <el-dialog v-model="skuPropertiesVisible" size="tiny">
            <div>
                <el-card class="box-card" v-for="(skuproperty, i) in skuProperties">
                    <div slot="header" class="clearfix" >
                        <span style="line-height: 36px;">{{skuproperty.specName}}</span>
                    </div>
                    <div v-for="index in skuproperty.options.length+1" class="text item">
                        <el-input  v-model="skuproperty.options[index-1]" auto-complete="off" style="width: 80%;"></el-input>
                        <el-button type="danger" icon="delete" size="mini" @click="deleteProperty(i, index-1)"></el-button>
                    </div>
                </el-card>
            </div>
            <div>
            <!--//sku动态table的展示-->
                <el-table :data="skus" highlight-current-row style="width: 100%;">
                    <el-table-column v-if="key!='indexes'&&key!='marketPrice'&&key!='availableStock'" v-for="(value,key) in skus[0]" :label="key" :prop="key">
                    </el-table-column>

                    <el-table-column v-if="key!='indexes'&&key=='marketPrice'||key=='availableStock'" v-for="(value,key) in skus[0]" :label="key" :prop="key">
                        <template scope="scope">
                            <el-input v-model="scope.row[key]" ></el-input>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div slot="footer" class="dialog-footer">
                <el-button @click.native="skuPropertiesVisible = false">取消</el-button>
                <el-button type="primary" @click.native="changeSkuProperties" :loading="changeLoading">提交</el-button>
            </div>
        </el-dialog>
    </section>
</template>

<script>
    import util from '../../common/js/util'
    //import NProgress from 'nprogress'
    import { getUserListPage, removeUser, batchRemoveUser, editUser, addUser } from '../../api/api';

    export default {
        data() {
            return {
                isShow: false,
                //显示属性维护模态窗
                viewPropertiesVisible: false,
                viewProperties: [], //显示属性数据
                //Sku属性维护模态窗
                skuPropertiesVisible: false,
                //显示Sku属性数据
                skuProperties: [],
                //Sku列表数据
                skus:[],
                showFileList: [],   //回显图片
                templatePics: [],   //保存选择了的所有图片
                dialogVisible: false,   //显示添加图片
                imageUrl: '',   //显示图片
                brands: [],  //商品品牌下拉框数据
                options: [],    //商品类型级联下拉框数据
                defaultProps: { //商品类型级联下拉框修改显示字段
                    value: 'id',
                    children: 'children',
                    label: 'name'
                },
                filters: {
                    keyword: ''
                },
                products: [],
                total: 0,
                page: 1,
                pageSize: 10,
                listLoading: false,
                //列表选中列
                sels: [],
                //添加、编辑界面数据
                changeForm: {
                    id: '',
                    name: '',
                    subName: '',
                    medias: '',
                    productTypeId: null,
                    brandId: null,
                    selectedOptions: [],    //级联下拉框选取后的数据
                    ext: {
                        description:'',
                        richContent:''
                    }
                },
                changeFormVisible: false,//新增、编辑界面是否显示
                changeLoading: false,
                changeFormRules: {
                    name: [
                        { required: true, message: '请输入商品名称', trigger: 'blur' }
                    ]
                }
            }
        },
        methods: {
            //显示属性维护
            handleViewProperties(){
                //只让选择一行数据
                if (this.sels.length != 1) {
                    this.$message({
                        message: "请选择一行数据进行查看",
                        type: "warning"
                    });
                } else {
                    let productId = this.sels[0].id;
                    this.$gpl.get("/product/product/getViewProperties?productId="+productId).then(result=>{
                        this.viewProperties = result.data;
                        this.viewPropertiesVisible = true;
                    });
                }
            },
            //显示属性维护提交
            changeViewProperties(){
                if (this.sels[0].state == 1) {
                    this.$message({
                        message: "修改显示属性之前请将该商品下架！",
                        type: "error"
                    });
                    return;
                }
                this.changeLoading = true;
                let productId = this.sels[0].id;
                this.$gpl.post("/product/product/changeViewProperties?productId="+productId,this.viewProperties)
                    .then(result=>{
                        if (result.data.success){
                            this.$message({
                                message: "显示属性修改成功！",
                                type: "success"
                            });
                            this.changeLoading = false;
                        } else {
                            this.$message({
                                message: result.data.message,
                                type: "error"
                            });
                        }
                    });
                this.viewPropertiesVisible = false;
            },
            //Sku属性维护
            handleSkuProperties(){
                //只让选择一行数据
                if (this.sels.length != 1) {
                    this.$message({
                        message: "请选择一行数据进行查看",
                        type: "warning"
                    });
                } else {
                    let productId = this.sels[0].id;
                    this.$gpl.get("/product/product/getSkuProperties?productId="+productId).then(result=>{
                        // console.debug(result);
                        this.skuProperties = result.data.skuProperties;
                        this.skus = result.data.skus;
                        this.skuPropertiesVisible = true;
                    });
                }
            },
            //Sku属性列删除
            deleteProperty(i1, i2){
                // //删除某天数据后
                // let count = 1;
                // for (let i = 1; i < this.skuProperties.length-1; i++) {
                //     count = count * this.skuProperties.length;
                // }
                console.debug(this.skus);
                console.debug(this.skuProperties[i1]);
                //删除的是那一列
                let specName = this.skuProperties[i1].specName;
                // console.debug(this.skuProperties[this.skuProperties.length-1].options.length);
                let ts = this.skuProperties[i1].options.splice(i2,1);
                //删除的是这列的那一个数据：
                console.debug(ts);

                // this.skus
            },
            //Sku属性维护提交
            changeSkuProperties(){
                if (this.sels[0].state == 1) {
                    this.$message({
                        message: "修改Sku属性之前请将该商品下架！",
                        type: "error"
                    });
                    return;
                }
                //将SkuProperties数组和skus数组封装传给后端
                this.changeLoading = true;
                let productId = this.sels[0].id;
                let param = {};
                param.skuProperties = this.skuProperties;
                param.skus = this.skus;
                console.debug(param);
                this.$gpl.post("/product/product/changeSkuProperties?productId="+productId,param)
                    .then(result=>{
                        if (result.data.success){
                            this.$message({
                                message: "显示属性修改成功！",
                                type: "success"
                            });
                            this.changeLoading = false;
                            this.skuPropertiesVisible = false;
                        } else {
                            this.$message({
                                message: result.data.message,
                                type: "error"
                            });
                        }
                    });
            },
            //上架
            handleOnSale(){
                var ids = this.sels.map(item => item.id).toString();
                this.$confirm('确认上架选中记录吗？', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.listLoading = true;

                    //批量上传
                    this.$gpl.get("/product/product/onSale?ids=" + ids).then(result=>{
                        this.listLoading = false;
                        if (result.data.success) {
                            this.$message({
                                message: "上架成功！",
                                type: "success"
                            });
                            this.getProducts();
                        } else {
                            this.$message({
                                message: result.data.message,
                                type: "error"
                            });
                        }
                    });
                }).catch(() => {
                    this.$message({
                        message: "服务器繁忙，请稍后在试。",
                        type: "warning"
                    });
                });
            },
            //格式化上架时间
            onSaleTimeFm(row, column){
                return this.timeFormatter(row.onSaleTime);
            },
            //下架
            handleOffSale(){
                var ids = this.sels.map(item => item.id).toString();
                this.$confirm('确认上架选中记录吗？', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.listLoading = true;

                    //批量上传
                    this.$gpl.get("/product/product/offSale?ids=" + ids).then(result=>{
                        this.listLoading = false;
                        if (result.data.success) {
                            this.$message({
                                message: "下架成功！",
                                type: "success"
                            });
                            this.getProducts();
                        } else {
                            this.$message({
                                message: result.data.message,
                                type: "error"
                            });
                        }
                    });
                }).catch(() => {
                    this.$message({
                        message: "服务器繁忙，请稍后在试。",
                        type: "warning"
                    });
                });
            },
            //格式化下架时间
            offSaleTimeFm(row, column){
                return this.timeFormatter(row.offSaleTime);
            },
            //格式化时间
            timeFormatter(time){
                if (!time) return null;
                let date = new Date(time);
                let year = date.getFullYear();
                let month = date.getMonth() + 1;
                let day = date.getDate();
                let hour = date.getHours();
                let minute = date.getMinutes();
                let second = date.getSeconds();
                return year+"-"+this.numFormatter(month)+"-"+this.numFormatter(day)+
                    " "+this.numFormatter(hour)+":"+this.numFormatter(minute)+":"+this.numFormatter(second);
            },
            //美化日期输出，将个位数前加0
            numFormatter(num){
                if (num >= 10) return num;
                return "0" + num;
            },
            //文件上传之前的钩子
            beforeUpload(file){
                const isJPG = file.type.split("/")[0] == "image";
                const isLt1M = file.size / 1024 / 1024 < 1;

                if (!isJPG) {
                    this.$message.error('只能上传图片!');
                }
                if (!isLt1M) {
                    this.$message.error('上传logo图片大小不能超过 1MB!');
                }
                return isJPG && isLt1M;
            },
            //文件上传成功后的钩子
            fileUploaded(response, file, fileList){
                this.templatePics.push(response.restObj);
                // this.imageUrl = "http://172.16.4.177" + response.restObj;
            },
            //点击已上传图片链接时的钩子
            picPreview(file){
                this.imageUrl = file.url;
                this.dialogVisible = true;
            },
            //图片移除时的钩子
            removePic(file, fileList){
                let path = null;
                if (file.response){
                    path = file.response.restObj;
                } else {
                    path = file.url.slice(19);
                    // console.debug(path);
                }
                for (let i = 0; i < this.templatePics.length; i++) {
                    if (path == this.templatePics[i]){
                        this.deletePicture(path);
                        this.templatePics.splice(i,1);
                    }
                }
            },
            //删除服务器图片
            deletePicture(path){
                this.$gpl.delete("/common/file?fileId="+path).then(result=>{
                    let {success, message} = result.data;
                    if (!success) {
                        this.$message({
                            message: message,
                            type: "error"
                        });
                    }
                });
            },
            //递归判断列表，把最后的children设为undefined
            getTreeData(data){
                for(var i = 0;i<data.length;i++){
                    if(data[i].children.length<1){
                        // children若为空数组，则将children设为undefined
                        data[i].children = undefined;
                    }else {
                        // children若不为空数组，则继续 递归调用 本方法
                        this.getTreeData(data[i].children);
                    }
                }
                return data;
            },
            //页面改变
            handleCurrentChange(val) {
                this.page = val;
                this.getProducts();
            },
            //获取商品列表
            getProducts() {
                let para = {
                    page: this.page,
                    rows: this.pageSize,
                    keyword: this.filters.keyword
                };
                this.listLoading = true;

                //发送请求获取到所有的商品信息
                this.$gpl.post("/product/product/queryPage", para).then(result=>{
                    this.listLoading = false;
                    this.total = result.data.total;
                    this.products = result.data.rows;
                })
            },
            //获取商品类型级联下拉框
            getCascader(){
                this.$gpl.get("/product/productType/typeTree").then(result=>{
                    this.options = this.getTreeData(result.data);
                });
            },
            //获取商品品牌下拉框
            getBrands(){
                this.$gpl.get("/product/brand/list").then(result=>{
                    this.brands = result.data;
                });
            },
            //获取商品详情和描述数据
            getExt(id){
                this.$gpl.get("/product/productExt/findByProductId?id=" + id).then(result=>{
                    this.changeForm.ext = result.data;
                })
            },
            //删除多张图
            deleteAllPic(paths){
                let pathsArr = paths.split(",");
                for (const path of pathsArr) {
                    this.deletePicture(path);
                }
            },
            //删除
            handleDel: function (index, row) {
                if (row.state == 1) {
                    this.$message({
                        message: "删除商品之前请将该商品下架！",
                        type: "error"
                    });
                    return;
                }
                this.$confirm('确认删除该记录吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.listLoading = true;

                    //删除
                    this.$gpl.delete("/product/product/delete/"+row.id).then(result=>{
                        this.listLoading = false;
                        if (result.data.success){
                            this.$message({
                                message: "删除成功",
                                type: "success"
                            });
                            this.getProducts();
                            this.deleteAllPic(row.medias);
                        }
                    });
                }).catch(() => {
                    this.$message({
                        message: "服务器繁忙，请稍后在试。",
                        type: "warning"
                    });
                });
            },
            //显示编辑界面
            handleEdit: function (index, row) {
                if (row.state == 1) {
                    this.$message({
                        message: "修改商品之前请将该商品下架！",
                        type: "error"
                    });
                    return;
                }
                this.showFileList = [];
                var a = row.productType.path.split('.');
                this.changeFormVisible = true;
                this.changeForm = Object.assign({}, row);
                a = a.splice(1,a.length-2);
                for (let i = 0; i < a.length; i++) {
                    a[i] = parseInt(a[i]);
                }
                this.imageUrl = "http://172.16.4.177" + row.logo;
                this.changeForm.selectedOptions = a;
                this.getExt(row.id);
                this.templatePics = row.medias.split(",");
                for (let i = 0; i < this.templatePics.length; i++) {
                    let pic = {url: ''};
                    pic.url = "http://172.16.4.177" + this.templatePics[i];
                    this.showFileList.push(pic);
                }
                this.getCascader();
                this.getBrands();
            },
            //显示新增界面
            handleAdd: function () {
                this.changeFormVisible = true;
                this.changeForm= {
                    id: '',
                    name: '',
                    subName: '',
                    medias: '',
                    productTypeId: null,
                    brandId: null,
                    selectedOptions: [],    //级联下拉框选取后的数据
                    ext: {
                        description:'',
                        richContent:''
                    }
                };
                this.templatePics = [];
                this.showFileList = [];
                this.imageUrl = '';
                this.getCascader();
                this.getBrands();
            },
            //商品新增和编辑
            changeSubmit: function () {
                this.$refs.changeForm.validate((valid) => {
                    if (valid) {
                        this.$confirm('确认提交吗？', '提示', {}).then(() => {
                            this.changeLoading = true;
                            //NProgress.start();
                            this.changeForm.productTypeId =
                                this.changeForm.selectedOptions[this.changeForm.selectedOptions.length-1];
                            this.changeForm.medias = this.templatePics.join(",");
                            // this.changeForm.id = '';
                            let para = Object.assign({}, this.changeForm);
                            // 传数据到后台
                            this.$gpl.post("/product/product/add", para).then(result=>{
                                if (result.data.success) {
                                    this.$message({
                                        message: '提交成功',
                                        type: 'success'
                                    });
                                } else {
                                    this.$message({
                                        message: result.data.message,
                                        type: 'error'
                                    });
                                }
                                this.changeLoading = false;
                                this.changeFormVisible = false;
                                this.getProducts();
                            });
                        });
                    }
                });
            },
            //复选改变
            selsChange: function (sels) {
                this.sels = sels;
            },
            selChange(selection, row){
                if (row.state == 1) {
                    this.isShow = false;
                }
            },
            //批量删除
            batchRemove: function () {
                for (let i = 0; i < this.sels.length; i++) {
                    if (this.sels[i].state == 1) {
                        this.$message({
                            message: "批量删除商品中有未下架商品，请移除后再删除！",
                            type: "error"
                        });
                        return;
                    }
                }
                var ids = this.sels.map(item => item.id).toString();
                this.$confirm('确认删除选中记录吗？', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.listLoading = true;

                    //批量删除
                    this.$gpl.post("/product/product/deleteBatch/" + ids).then(result=>{
                        this.listLoading = false;
                        if (result.data.success) {
                            this.$message({
                                message: "删除成功",
                                type: "success"
                            });
                            this.getProducts();
                            for(let i = 0; i < this.sels.length; i++) {
                                this.deleteAllPic(this.sels[i].medias);
                            }
                        }
                    });
                }).catch(() => {
                    this.$message({
                        message: "服务器繁忙，请稍后在试。",
                        type: "warning"
                    });
                });
            }
        },
        //监听函数，监听数据变化
        watch: {
            //监听skuProperties数据变化，然后动态展示sku列表
            skuProperties:{
                handler(val, oldVal) {
                    //过滤掉options为空的sku属性
                    let skuPropertiesArray = this.skuProperties.filter(e=>e.options.length>0);
                    let x = 0;
                    let result = skuPropertiesArray.reduce((pre,cur,index)=>{
                        let temp = [];
                        pre.forEach(e1=>{
                            cur.options.forEach((e2,index2)=>{
                                let obj = Object.assign({},e1);
                                obj[cur.specName] = e2;

                                let finalIndexes = obj.indexes;
                                if (!finalIndexes) finalIndexes = '';

                                //判断是否是最后一次
                                if (index == skuPropertiesArray.length - 1) {
                                    // console.debug(x,this.skus[x]);
                                    // console.debug(this.skus);
                                    if (x<this.skus.length) {
                                        obj.marketPrice = this.skus[x].marketPrice;
                                        obj.availableStock = this.skus[x].availableStock;
                                        if (obj.marketPrice == null) {
                                            obj.marketPrice = 0;
                                        }
                                        if (obj.availableStock == null) {
                                            obj.availableStock = 0;
                                        }
                                        x++;
                                    } else {
                                        obj.marketPrice = 0;
                                        obj.availableStock = 0;
                                    }
                                    finalIndexes += index2;
                                } else {
                                    finalIndexes += index2 + ".";
                                }
                                obj.indexes = finalIndexes;
                                temp.push(obj);
                            })
                        });
                        return temp;
                    }, [{}]);
                    this.skus = result;
                },
                deep: true
            }
        },
        mounted() {
            this.getProducts();
        }
    }

</script>

<style scoped>

</style>