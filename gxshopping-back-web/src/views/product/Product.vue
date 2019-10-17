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
            </el-form>
        </el-col>

        <!--列表-->
        <el-table :data="products" highlight-current-row v-loading="listLoading" @selection-change="selsChange" style="width: 100%;">
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
                    <el-button size="small" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
                    <el-button type="danger" size="small" @click="handleDel(scope.$index, scope.row)">删除</el-button>
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
                <el-button type="primary" @click.native="addSubmit" :loading="changeLoading">提交</el-button>
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
                sels: [],//列表选中列
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
            //格式化上架时间
            onSaleTimeFm(row, column){
                return this.timeFormatter(row.onSaleTime);
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
                console.debug(file);
                console.debug("11",this.showFileList);
                console.debug("22",this.templatePics);
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
            // 递归判断列表，把最后的children设为undefined
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
                this.$confirm('确认删除该记录吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.listLoading = true;
                    //NProgress.start();

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
                console.debug(this.templatePics)
                for (let i = 0; i < this.templatePics.length; i++) {
                    let pic = {url: ''};
                    pic.url = "http://172.16.4.177" + this.templatePics[i];
                    this.showFileList.push(pic);
                }
                console.debug("fileList",this.showFileList);
                // this.showFileList
                // console.debug("changeForm",this.changeForm);
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
            //新增和编辑
            addSubmit: function () {
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
            selsChange: function (sels) {
                this.sels = sels;
            },
            //批量删除
            batchRemove: function () {
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
        mounted() {
            this.getProducts();
        }
    }

</script>

<style scoped>

</style>