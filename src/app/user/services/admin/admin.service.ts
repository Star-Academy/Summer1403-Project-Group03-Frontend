import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RegisterRequest, UpdateUserRequest } from '../../models/User';
import { GetUserResponse } from '../../interfaces/manage-users.interface';
import { Subject } from 'rxjs';
import { environment } from '../../../../../api-config/api-url';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = environment.apiUrl + '/api/Admin';
  private usersData = new Subject<GetUserResponse>();
  private notification = new Subject<{ status: boolean; message: string }>();

  usersData$ = this.usersData.asObservable();
  notification$ = this.notification.asObservable();

  constructor(private http: HttpClient) {}

  createUser(request: RegisterRequest, pageSize: number, pageIndex: number) {
    return this.http
      .post(`${this.apiUrl}/register`, request, {
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          this.getUsers(pageSize, pageIndex);
          this.notification.next({
            status: true,
            message: 'User added successfully!',
          });
        },
        error: (error) => {
          this.notification.next({
            status: false,
            message: error.error.message,
          });
        },
      });
  }

  getUsers(limit = 10, page = 0) {
    this.http
      .get<GetUserResponse>(
        `${this.apiUrl}/GetUsersPagination?limit=${limit}&page=${page}`,
        {
          withCredentials: true,
        }
      )
      .subscribe((users) => {
        this.usersData.next(users);
      });
  }

  deleteUser(id: string, pageSize: number, pageIndex: number) {
    this.http
      .delete(`${this.apiUrl}/DeleteUser?id=${id}`, {
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          this.getUsers(pageSize, pageIndex);
          this.notification.next({
            status: true,
            message: 'User deleted successfully!',
          });
        },
        error: (error) => {
          this.notification.next({
            status: false,
            message: error.error.message,
          });
        },
      });
  }

  updateUser(
    id: string,
    request: UpdateUserRequest,
    pageSize: number,
    pageIndex: number
  ) {
    return this.http
      .put(`${this.apiUrl}/UpdateUser?id=${id}`, request, {
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          this.getUsers(pageSize, pageIndex);
          this.notification.next({
            status: true,
            message: 'User updated successfully!',
          });
        },
        error: (error) => {
          this.notification.next({
            status: false,
            message: error.error.message,
          });
        },
      });
  }
}
