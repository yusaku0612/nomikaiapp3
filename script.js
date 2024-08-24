new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  data: {
    activeTab: 'register',  // 初期タブはイベント登録
    eventDate: '',
    eventName: '',
    participants: '',
    totalAmount: 0,
    paymentFlag: false,
    calculationResult: null,
    searchType: 'date',  // 初期検索条件は日付
    searchDate: '',
    searchEventName: '',
    searchName: '',
    searchResults: []  // 検索結果を格納する配列
  },
  watch: {
    // タブが切り替わったときに計算結果をリセット
    activeTab(newTab) {
      if (newTab === 'search') {
        this.calculationResult = null;
      }
    }
  },
  methods: {
    async saveNomikaiEvent() {
      try {
        const participantList = this.participants.split('、').map(p => p.trim());
        const numberOfParticipants = participantList.length;
        const amountPerParticipant = this.totalAmount / numberOfParticipants;

        const response = await fetch('https://m3h-beerkn-functionapp.azurewebsites.net/api/savenomikai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            EventDate: this.eventDate,
            EventName: this.eventName,
            Participants: this.participants,
            Amount: this.totalAmount,
            PaymentFlag: this.paymentFlag
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`飲み会イベントの保存に失敗しました: ${response.status} ${response.statusText} - ${errorText}`);
        }

        this.calculationResult = amountPerParticipant;
        // 成功メッセージを削除しました
      } catch (error) {
        console.error('エラー:', error);
        alert('エラーが発生しました。飲み会イベントの保存に失敗しました。');
      }
    },
    async searchNomikaiEvent() {
      try {
        let url = 'https://m3h-beerkn-functionapp.azurewebsites.net/api/nomikai/search?';

        if (this.searchType === 'date') {
          url += `eventdate=${this.searchDate}`;
        } else if (this.searchType === 'eventName') {
          url += `eventname=${encodeURIComponent(this.searchEventName)}`;
        } else if (this.searchType === 'name') {
          url += `name=${encodeURIComponent(this.searchName)}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`イベントの検索に失敗しました: ${response.status} ${response.statusText} - ${errorText}`);
        }

        this.searchResults = await response.json();
        console.log('検索結果:', this.searchResults);
      } catch (error) {
        console.error('エラー:', error);
        alert('エラーが発生しました。イベントの検索に失敗しました。');
      }
    },
    async updatePaymentFlags() {
      try {
        const updates = this.searchResults.map(result => ({
          id: result.id,
          paymentFlag: result.paymentFlag
        }));

        const response = await fetch('https://m3h-beerkn-functionapp.azurewebsites.net/api/updatepaymentflags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`支払いフラグの更新に失敗しました: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('更新レスポンスボディ:', data);

        // 更新成功メッセージを削除しました
      } catch (error) {
        console.error('エラー:', error);
        alert('エラーが発生しました。支払いフラグの更新に失敗しました。');
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('ja-JP');
    }
  }
});