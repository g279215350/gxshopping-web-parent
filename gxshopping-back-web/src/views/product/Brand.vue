<template>
    <section>
        <!--工具条-->
        <el-col :span="24" class="toolbar" style="padding-bottom: 0px;">
            <el-form :inline="true" :model="filters">
                <el-form-item>
                    <el-input v-model="filters.keyword" placeholder="关键字"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" v-on:click="getBrands">查询</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleAdd">新增</el-button>
                </el-form-item>
            </el-form>
        </el-col>

        <!--列表-->
        <el-table :data="brands" highlight-current-row v-loading="listLoading" @selection-change="selsChange" style="width: 100%;">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column type="index" width="60">
            </el-table-column>
            <el-table-column prop="name" label="商品名称" width="120" sortable>
            </el-table-column>
            <el-table-column prop="englishName" label="英语名称" width="120" sortable>
            </el-table-column>
            <el-table-column prop="firstLetter" label="首字母" width="120" sortable>
            </el-table-column>
            <el-table-column prop="logo" label="商品商标" width="120" sortable>
                <img src="scope.row.logo" style="height: 50px;"/>
            </el-table-column>
            <el-table-column prop="productType.name" label="商品类型" width="180" sortable>
            </el-table-column>
            <el-table-column prop="description" label="商品描述" min-width="120" sortable>
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
        <el-dialog title="新增" v-model="addFormVisible" :close-on-click-modal="false">
            <el-form :model="changeForm" label-width="80px" :rules="addFormRules" ref="changeForm">
                <el-form-item label="品牌名称" prop="name">
                    <el-input v-model="changeForm.name" auto-complete="off"></el-input>
                </el-form-item>
                <el-form-item label="英文名称" prop="englishName">
                    <el-input v-model="changeForm.englishName" auto-complete="off"></el-input>
                </el-form-item>
                <el-form-item label="品牌类型">
                    <el-cascader
                            expand-trigger="hover"
                            :options="options"
                            v-model="changeForm.selectedOptions"
                            :props="defaultProps">
                    </el-cascader>
                </el-form-item>
                <el-form-item label="品牌描述">
                    <el-input type="textarea" v-model="changeForm.description"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click.native="addFormVisible = false">取消</el-button>
                <el-button type="primary" @click.native="addSubmit" :loading="addLoading">提交</el-button>
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
                options: [],    //级联下拉框数据
                defaultProps: { //修改显示字段
                    value: 'id',
                    children: 'children',
                    label: 'name'
                },
                filters: {
                    keyword: ''
                },
                brands: [],
                total: 0,
                page: 1,
                pageSize: 10,
                listLoading: false,
                sels: [],//列表选中列
                // editFormVisible: false,//编辑界面是否显示
                // editLoading: false,
                // editFormRules: {
                //     name: [
                //         { required: true, message: '请输入姓名', trigger: 'blur' }
                //     ]
                // },
                //编辑界面数据
                changeForm: {
                    id: '',
                    name: '',
                    englishName: '',
                    logo: '',
                    description: '',
                    productTypeId: -1,
                    selectedOptions: []    //级联下拉框选取后的数据
                },

                addFormVisible: false,//新增界面是否显示
                addLoading: false,
                addFormRules: {
                    name: [
                        { required: true, message: '请输入品牌名称', trigger: 'blur' }
                    ]
                }
            }
        },
        methods: {
            handleCurrentChange(val) {
                this.page = val;
                this.getBrands();
            },
            //获取品牌列表
            getBrands() {
                let para = {
                    page: this.page,
                    rows: this.pageSize,
                    keyword: this.filters.keyword
                };
                this.listLoading = true;

                //发送请求获取到所有的商品品牌信息
                this.$gpl.post("/product/brand/queryPage", para).then(result=>{
                    this.listLoading = false;
                    this.total = result.data.total;
                    this.brands = result.data.rows;
                })
            },
            //获取商品类型级联下拉框
            getCascader(){
                //todo
                this.$gpl.get("/product/productType/typeTree").then(result=>{
                    this.options = result.data;
                });
            },
            //删除
            handleDel: function (index, row) {
                this.$confirm('确认删除该记录吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.listLoading = true;
                    //NProgress.start();

                    //删除
                    this.$gpl.delete("/product/brand/delete/"+row.id).then(result=>{
                        this.listLoading = false;
                        if (result.data.success){
                            this.$message({
                                message: "删除成功",
                                type: "success"
                            });
                            this.getBrands();
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
                var a = row.productType.path.split('.');
                this.addFormVisible = true;
                this.changeForm = Object.assign({}, row);
                a = a.splice(1,a.length-2);
                for (let i = 0; i < a.length; i++) {
                    a[i] = parseInt(a[i]);
                }
                this.changeForm.selectedOptions = a;
                this.getCascader();
            },
            //显示新增界面
            handleAdd: function () {
                this.addFormVisible = true;
                this.changeForm= {};
                this.getCascader();
            },
            //新增和编辑
            addSubmit: function () {
                // console.debug(this.changeForm);
                this.$refs.addForm.validate((valid) => {
                    if (valid) {
                        this.$confirm('确认提交吗？', '提示', {}).then(() => {
                            this.addLoading = true;
                            //NProgress.start();
                            this.changeForm.productTypeId =
                                this.changeForm.selectedOptions[this.changeForm.selectedOptions.length-1];
                            // this.changeForm.id = '';
                            let para = Object.assign({}, this.changeForm);

                            // 传数据到后台
                            this.$gpl.post("/product/brand/add", para).then(result=>{
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
                                this.addLoading = false;
                                this.addFormVisible = false;
                                this.getBrands();
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
                    this.$gpl.post("/product/brand/deleteBatch/" + ids).then(result=>{
                        this.listLoading = false;
                        if (result.data.success) {
                            this.$message({
                                message: "删除成功",
                                type: "success"
                            });
                            this.getBrands();
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
            this.getBrands();
        }
    }

</script>

<style scoped>

</style>